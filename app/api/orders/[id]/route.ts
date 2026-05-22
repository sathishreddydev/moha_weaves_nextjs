import { NextRequest, NextResponse } from "next/server";
import { orderService } from "../orderService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/server";
import { db } from "@/lib/db";
import { onlineExchangeItems, onlineExchanges, productReviews, refunds, returnItems, returnRequests } from "@/shared";
import { and, eq, inArray } from "drizzle-orm";

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

    const orderItemIds = order.items.map((item: any) => item.id);

    // ── Run all enrichment queries in parallel ───────────────────────────────
    const [orderReturnRequests, orderExchanges, userReviewsFiltered] = await Promise.all([
      // Return requests for this order
      db.select().from(returnRequests).where(eq(returnRequests.orderId, id)),
      // Exchange requests for this order
      db.select().from(onlineExchanges).where(eq(onlineExchanges.orderId, id)),
      // User reviews for these order items
      orderItemIds.length
        ? db
            .select({
              id: productReviews.id,
              productId: productReviews.productId,
              orderItemId: productReviews.orderItemId,
              rating: productReviews.rating,
              title: productReviews.title,
              comment: productReviews.comment,
              images: productReviews.images,
              isVerifiedPurchase: productReviews.isVerifiedPurchase,
              helpfulCount: productReviews.helpfulCount,
              createdAt: productReviews.createdAt,
            })
            .from(productReviews)
            .where(
              and(
                eq(productReviews.userId, user.id),
                inArray(productReviews.orderItemId, orderItemIds)
              )
            )
        : Promise.resolve([]),
    ]);

    // ── Fetch return items + refunds (depends on returnRequests result) ──────
    const returnRequestIds = orderReturnRequests.map((r) => r.id);
    const exchangeIds = orderExchanges.map((e) => e.id);

    const [allReturnItems, allRefunds, allExchangeItems] = await Promise.all([
      returnRequestIds.length
        ? db.select().from(returnItems).where(inArray(returnItems.returnRequestId, returnRequestIds))
        : Promise.resolve([]),
      returnRequestIds.length
        ? db.select().from(refunds).where(inArray(refunds.returnRequestId, returnRequestIds))
        : Promise.resolve([]),
      exchangeIds.length
        ? db.select().from(onlineExchangeItems).where(inArray(onlineExchangeItems.exchangeId, exchangeIds))
        : Promise.resolve([]),
    ]);

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

    // Build map: orderItemId → review
    const reviewMap: Record<string, (typeof userReviewsFiltered)[0]> = {};
    for (const review of userReviewsFiltered) {
      if (review.orderItemId) reviewMap[review.orderItemId] = review;
    }

    // Attach returnInfo, exchangeInfo, and reviewInfo to each item
    const enrichedItems = order.items.map((item: any) => {
      const returnInfo = itemReturnMap[item.id];
      const exchangeEntry = itemExchangeMap[item.id];
      const review = reviewMap[item.id]; // keyed by orderItemId

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
                exchangeVariantId: exchangeEntry.exchangeItem.exchangeVariantId ?? null,
                createdAt: exchangeEntry.exchange.createdAt,
                updatedAt: exchangeEntry.exchange.updatedAt,
              },
            }
          : {}),
        // Attach this user's review for this product (if any)
        ...(review
          ? {
              reviewInfo: {
                id: review.id,
                rating: review.rating,
                title: review.title,
                comment: review.comment,
                images: review.images ?? [],
                isVerifiedPurchase: review.isVerifiedPurchase,
                helpfulCount: review.helpfulCount,
                createdAt: review.createdAt,
              },
              hasReviewed: true,
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
