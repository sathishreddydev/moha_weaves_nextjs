import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/server";
import {
  onlineExchanges,
  onlineExchangeItems,
  orderItems,
} from "@/shared";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { storage } from "../orders/storage";
import { publishRealtimeEvent } from "@/realtime/publisher";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const exchanges = await db
      .select()
      .from(onlineExchanges)
      .where(eq(onlineExchanges.userId, session.user.id));

    return NextResponse.json(exchanges);
  } catch (error) {
    console.error("Error fetching exchanges:", error);
    return NextResponse.json(
      { message: "Failed to fetch exchanges" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, reason, reasonDetails, items } = body;

    if (!orderId || !reason || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { message: "Missing required fields: orderId, reason, items" },
        { status: 400 }
      );
    }

    const validReasons = [
      "defective",
      "wrong_item",
      "not_as_described",
      "size_issue",
      "color_mismatch",
      "damaged_in_shipping",
      "changed_mind",
      "quality_issue",
      "other",
    ];
    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { message: `Invalid reason. Must be one of: ${validReasons.join(", ")}` },
        { status: 400 }
      );
    }

    const exchange = await db.transaction(async (tx) => {
      const [newExchange] = await tx
        .insert(onlineExchanges)
        .values({
          orderId,
          userId: session.user.id,
          reason,
          reasonDetails: reasonDetails || null,
          status: "exchange_requested",
        })
        .returning();

      for (const item of items) {
        const { orderItemId, quantity } = item;

        if (!orderItemId || !quantity || quantity < 1) {
          throw new Error("Each item must have a valid orderItemId and quantity");
        }

        await tx.insert(onlineExchangeItems).values({
          exchangeId: newExchange.id,
          orderItemId,
          quantity,
          exchangeproductId: item.exchangeproductId || null,
          exchangeVariantId: item.exchangeVariantId || null,
        });

        // Fetch current status before updating
        const [currentItem] = await tx
          .select({ status: orderItems.status })
          .from(orderItems)
          .where(eq(orderItems.id, orderItemId));

        const previousStatus = currentItem?.status ?? "delivered";

        await tx
          .update(orderItems)
          .set({ status: "exchange_requested", updatedAt: new Date() })
          .where(eq(orderItems.id, orderItemId));

        await storage.itemHistory(
          orderItemId,
          previousStatus,
          "exchange_requested",
          "Online exchange request created",
          session.user.id
        );
      }

      return newExchange;
    });

    // Emit realtime event so the order detail page auto-refreshes and shows exchangeInfo
    publishRealtimeEvent("product_exchanged", {
      orderId: exchange.orderId,
      itemId: items[0]?.orderItemId ?? null,
      userId: session.user.id,
      status: "exchange_requested",
    }).catch((err) => console.error("Failed to emit product_exchanged event:", err));

    return NextResponse.json(exchange);
  } catch (error) {
    console.error("Error creating exchange request:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to create exchange request",
      },
      { status: 500 }
    );
  }
}
