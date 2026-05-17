import { NextRequest, NextResponse } from "next/server";
import { orderService } from "../orderService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/server";
import { db } from "@/lib/db";
import { onlineExchangeItems, onlineExchanges, refunds, returnItems, returnRequests } from "@/shared";
import { eq, inArray } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const user = session.user;

    const order = await orderService.getOrder(id);

    if (!order || order.userId !== user.id) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    // ── Enrich each item with its active return request + refund ──────────────
    // Fetch all return requests for this order in one query
    const orderReturnRequests = await db
      .select()
      .from(returnRequests)
      .where(eq(returnRequests.orderId, id));

    // Fetch all return items for those requests
    const returnRequestIds = orderReturnRequests.map((r) => r.id);
    const allReturnItems = returnRequestIds.length
      ? await db
          .select()
          .from(returnItems)
          .where(inArray(returnItems.returnRequestId, returnRequestIds))
      : [];

    // Fetch refunds for those return requests
    const allRefunds = returnRequestIds.length
      ? await db
          .select()
          .from(refunds)
          .where(inArray(refunds.returnRequestId, returnRequestIds))
      : [];

    // Build a map: orderItemId → { returnRequest, refund }
    const itemReturnMap: Record<
      string,
      { returnRequest: (typeof orderReturnRequests)[0]; refund?: (typeof allRefunds)[0] }
    > = {};

    for (const ri of allReturnItems) {
      const req = orderReturnRequests.find((r) => r.id === ri.returnRequestId);
      if (!req) continue;
      // Skip cancelled returns — don't show them as active
      if (req.status === "return_cancelled") continue;
      const refund = allRefunds.find((rf) => rf.returnRequestId === req.id);
      itemReturnMap[ri.orderItemId] = { returnRequest: req, refund };
    }

    // ── Enrich each item with its active exchange request ─────────────────────
    const orderExchanges = await db
      .select()
      .from(onlineExchanges)
      .where(eq(onlineExchanges.orderId, id));

    const exchangeIds = orderExchanges.map((e) => e.id);
    const allExchangeItems = exchangeIds.length
      ? await db
          .select()
          .from(onlineExchangeItems)
          .where(inArray(onlineExchangeItems.exchangeId, exchangeIds))
      : [];

    // Build a map: orderItemId → { exchange, exchangeItem }
    const itemExchangeMap: Record<
      string,
      { exchange: (typeof orderExchanges)[0]; exchangeItem: (typeof allExchangeItems)[0] }
    > = {};
    for (const ei of allExchangeItems) {
      const exc = orderExchanges.find((e) => e.id === ei.exchangeId);
      if (!exc) continue;
      // Skip cancelled exchanges
      if (exc.status === "exchange_cancelled") continue;
      itemExchangeMap[ei.orderItemId] = { exchange: exc, exchangeItem: ei };
    }

    // Attach returnInfo and exchangeInfo to each item
    const enrichedItems = order.items.map((item: any) => {
      const returnInfo = itemReturnMap[item.id];
      const exchangeEntry = itemExchangeMap[item.id];

      return {
        ...item,
        ...(returnInfo
          ? {
              returnInfo: {
                returnRequestId: returnInfo.returnRequest.id,
                status: returnInfo.returnRequest.status,
                resolution: returnInfo.returnRequest.resolution,
                reason: returnInfo.returnRequest.reason,
                reasonDetails: returnInfo.returnRequest.reasonDetails,
                refundAmount: returnInfo.returnRequest.refundAmount,
                createdAt: returnInfo.returnRequest.createdAt,
                updatedAt: returnInfo.returnRequest.updatedAt,
                refund: returnInfo.refund
                  ? {
                      id: returnInfo.refund.id,
                      status: returnInfo.refund.status,
                      amount: returnInfo.refund.amount,
                      initiatedAt: returnInfo.refund.initiatedAt,
                      completedAt: returnInfo.refund.completedAt,
                      failureReason: returnInfo.refund.failureReason,
                    }
                  : null,
              },
            }
          : {}),
        ...(exchangeEntry
          ? {
              exchangeInfo: {
                exchangeId: exchangeEntry.exchange.id,
                status: exchangeEntry.exchange.status,
                reason: exchangeEntry.exchange.reason,
                reasonDetails: exchangeEntry.exchange.reasonDetails,
                exchangeOrderId: exchangeEntry.exchange.exchangeOrderId,
                // Variant the customer requested as replacement
                exchangeVariantId: exchangeEntry.exchangeItem.exchangeVariantId ?? null,
                createdAt: exchangeEntry.exchange.createdAt,
                updatedAt: exchangeEntry.exchange.updatedAt,
              },
            }
          : {}),
      };
    });

    return NextResponse.json({ ...order, items: enrichedItems });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch order" },
      { status: 500 }
    );
  }
}
