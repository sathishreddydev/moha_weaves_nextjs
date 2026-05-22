import { db } from "@/lib/db";
import {
  InsertProductReview,
  ProductReview,
  ProductWithReviews,
  orderItems,
  orders,
  productReviews,
  reviewVotes,
  users,
} from "@/shared";
import { and, desc, eq, sql } from "drizzle-orm";
import { productService } from "../../productService";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReviewWithUser = Omit<
  typeof productReviews.$inferSelect,
  "userId"
> & {
  user: { id: string; name: string };
};

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}

export interface PaginatedReviews {
  reviews: ReviewWithUser[];
  total: number;
}

// ─── Repository ───────────────────────────────────────────────────────────────

export class ReviewRepository {
  /**
   * Fetch a paginated list of reviews for a product.
   * Reviews go live immediately (Shopify-style) — no approval gate.
   * Trust is signalled via isVerifiedPurchase badge.
   */
  async getProductReviews(
    productId: string,
    opts: { page: number; limit: number } = { page: 1, limit: 10 },
  ): Promise<PaginatedReviews> {
    const offset = (opts.page - 1) * opts.limit;

    const rows = await db
      .select()
      .from(productReviews)
      .innerJoin(users, eq(users.id, productReviews.userId))
      .where(eq(productReviews.productId, productId))
      .orderBy(desc(productReviews.createdAt))
      .limit(opts.limit)
      .offset(offset);

    // Total count for pagination (separate lightweight query)
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(productReviews)
      .where(eq(productReviews.productId, productId));

    return {
      reviews: rows.map((row) => ({
        ...row.product_reviews,
        user: { id: row.users.id, name: row.users.name },
      })),
      total: count,
    };
  }

  /**
   * Aggregate stats (average rating + distribution) across ALL reviews.
   * Used to populate the summary bar regardless of current page.
   */
  async getReviewStats(productId: string): Promise<ReviewStats> {
    const [summary] = await db
      .select({
        averageRating: sql<number>`COALESCE(AVG(${productReviews.rating}), 0)`,
        totalReviews: sql<number>`COUNT(*)`,
      })
      .from(productReviews)
      .where(eq(productReviews.productId, productId));

    const distributionRows = await db
      .select({
        rating: productReviews.rating,
        count: sql<number>`COUNT(*)`,
      })
      .from(productReviews)
      .where(eq(productReviews.productId, productId))
      .groupBy(productReviews.rating);

    const ratingDistribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    for (const row of distributionRows) {
      ratingDistribution[row.rating] = row.count;
    }

    return {
      averageRating: Number(summary.averageRating),
      totalReviews: Number(summary.totalReviews),
      ratingDistribution,
    };
  }

  async getReview(id: string): Promise<ProductReview | undefined> {
    const [result] = await db
      .select()
      .from(productReviews)
      .where(eq(productReviews.id, id));
    return result ?? undefined;
  }

  /**
   * Insert a new review and return the created record with user info.
   */
  async createReview(review: InsertProductReview): Promise<ReviewWithUser> {
    const [inserted] = await db
      .insert(productReviews)
      .values(review)
      .returning();

    const [userRow] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, inserted.userId));

    // Return the created review without exposing userId
    const { userId: _userId, ...rest } = inserted;
    return {
      ...rest,
      user: { id: userRow.id, name: userRow.name },
    };
  }

  async getUserReviews(userId: string): Promise<ProductReview[]> {
    return db
      .select()
      .from(productReviews)
      .where(eq(productReviews.userId, userId))
      .orderBy(desc(productReviews.createdAt));
  }

  async getProductWithReviews(
    productId: string,
  ): Promise<ProductWithReviews | undefined> {
    const product = await productService.getProductByRole(productId, "user");
    if (!product) return undefined;

    const { reviews, total } = await this.getProductReviews(productId, {
      page: 1,
      limit: 10,
    });
    const stats = await this.getReviewStats(productId);

    return {
      ...product,
      reviews,
      averageRating: stats.averageRating,
      reviewCount: total,
    };
  }

  /**
   * Returns true only when:
   *  1. The specific order item exists, belongs to this user, and is delivered.
   *  2. The user has NOT already reviewed this specific order item.
   *
   * Scoping by orderItemId means the same product bought in two separate
   * orders can each receive their own review.
   */
  async canUserReviewProduct(
    userId: string,
    productId: string,
    orderItemId?: string,
  ): Promise<boolean> {
    if (orderItemId) {
      // Precise check: this specific order item must be delivered and unreviewed
      const delivered = await db
        .select({ id: orderItems.id })
        .from(orders)
        .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
        .where(
          and(
            eq(orders.userId, userId),
            eq(orderItems.id, orderItemId),
            eq(orderItems.productId, productId),
            eq(orderItems.status, "delivered"),
          ),
        )
        .limit(1);

      if (delivered.length === 0) return false;

      const existing = await db
        .select({ id: productReviews.id })
        .from(productReviews)
        .where(
          and(
            eq(productReviews.userId, userId),
            eq(productReviews.orderItemId, orderItemId),
          ),
        )
        .limit(1);

      return existing.length === 0;
    }

    // Fallback (no orderItemId): any delivered item for this product, no existing review
    const delivered = await db
      .select({ id: orderItems.id })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .where(
        and(
          eq(orders.userId, userId),
          eq(orderItems.status, "delivered"),
          eq(orderItems.productId, productId),
        ),
      )
      .limit(1);

    if (delivered.length === 0) return false;

    const existing = await db
      .select({ id: productReviews.id })
      .from(productReviews)
      .where(
        and(
          eq(productReviews.userId, userId),
          eq(productReviews.productId, productId),
        ),
      )
      .limit(1);

    return existing.length === 0;
  }

  /**
   * Check whether a user has already reviewed a specific order item.
   * Scoped by orderItemId so the same product in two orders is handled correctly.
   * Falls back to productId check when no orderItemId is provided.
   */
  async hasUserReviewed(
    userId: string,
    productId: string,
    orderItemId?: string
  ): Promise<boolean> {
    if (orderItemId) {
      const existing = await db
        .select({ id: productReviews.id })
        .from(productReviews)
        .where(
          and(
            eq(productReviews.userId, userId),
            eq(productReviews.orderItemId, orderItemId)
          )
        )
        .limit(1);
      return existing.length > 0;
    }

    const existing = await db
      .select({ id: productReviews.id })
      .from(productReviews)
      .where(
        and(
          eq(productReviews.userId, userId),
          eq(productReviews.productId, productId)
        )
      )
      .limit(1);

    return existing.length > 0;
  }

  /**
   * Vote on a review (helpful or unhelpful).
   * Per-user dedup: each user can only vote once per review.
   * If user already voted the same type, it's a no-op.
   * If user voted the opposite type, it switches the vote.
   */
  async voteReview(
    reviewId: string,
    userId: string,
    voteType: "helpful" | "unhelpful"
  ): Promise<{ helpfulCount: number; unhelpfulCount: number; userVote: string } | undefined> {
    // Check if user already voted on this review
    const [existingVote] = await db
      .select()
      .from(reviewVotes)
      .where(
        and(
          eq(reviewVotes.reviewId, reviewId),
          eq(reviewVotes.userId, userId)
        )
      )
      .limit(1);

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // Same vote — return current counts (no-op)
        const [review] = await db
          .select({ helpfulCount: productReviews.helpfulCount, unhelpfulCount: productReviews.unhelpfulCount })
          .from(productReviews)
          .where(eq(productReviews.id, reviewId));
        if (!review) return undefined;
        return { helpfulCount: review.helpfulCount ?? 0, unhelpfulCount: review.unhelpfulCount ?? 0, userVote: voteType };
      }

      // Switch vote: decrement old, increment new
      const oldType = existingVote.voteType;
      const decrementCol = oldType === "helpful" ? productReviews.helpfulCount : productReviews.unhelpfulCount;
      const incrementCol = voteType === "helpful" ? productReviews.helpfulCount : productReviews.unhelpfulCount;

      await db
        .update(productReviews)
        .set({
          [oldType === "helpful" ? "helpfulCount" : "unhelpfulCount"]: sql`GREATEST(0, ${decrementCol} - 1)`,
          [voteType === "helpful" ? "helpfulCount" : "unhelpfulCount"]: sql`${incrementCol} + 1`,
        })
        .where(eq(productReviews.id, reviewId));

      // Update the vote record
      await db
        .update(reviewVotes)
        .set({ voteType })
        .where(eq(reviewVotes.id, existingVote.id));
    } else {
      // New vote
      const incrementCol = voteType === "helpful" ? productReviews.helpfulCount : productReviews.unhelpfulCount;

      await db
        .update(productReviews)
        .set({
          [voteType === "helpful" ? "helpfulCount" : "unhelpfulCount"]: sql`${incrementCol} + 1`,
        })
        .where(eq(productReviews.id, reviewId));

      await db.insert(reviewVotes).values({
        reviewId,
        userId,
        voteType,
      });
    }

    // Return updated counts
    const [updated] = await db
      .select({ helpfulCount: productReviews.helpfulCount, unhelpfulCount: productReviews.unhelpfulCount })
      .from(productReviews)
      .where(eq(productReviews.id, reviewId));

    if (!updated) return undefined;
    return { helpfulCount: updated.helpfulCount ?? 0, unhelpfulCount: updated.unhelpfulCount ?? 0, userVote: voteType };
  }

  /**
   * Get the current user's votes for a list of review IDs.
   * Used to pre-populate the UI on page load.
   */
  async getUserVotes(userId: string, reviewIds: string[]): Promise<Record<string, string>> {
    if (!reviewIds.length) return {};

    const votes = await db
      .select({ reviewId: reviewVotes.reviewId, voteType: reviewVotes.voteType })
      .from(reviewVotes)
      .where(
        and(
          eq(reviewVotes.userId, userId),
          sql`${reviewVotes.reviewId} = ANY(${reviewIds})`
        )
      );

    const map: Record<string, string> = {};
    for (const v of votes) {
      map[v.reviewId] = v.voteType;
    }
    return map;
  }

  /**
   * @deprecated Use voteReview instead. Kept for backward compatibility.
   */
  async markHelpful(reviewId: string): Promise<ReviewWithUser | undefined> {
    const [updated] = await db
      .update(productReviews)
      .set({ helpfulCount: sql`${productReviews.helpfulCount} + 1` })
      .where(eq(productReviews.id, reviewId))
      .returning();

    if (!updated) return undefined;

    const [userRow] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, updated.userId));

    const { userId: _userId, ...rest } = updated;
    return {
      ...rest,
      user: { id: userRow.id, name: userRow.name },
    };
  }
}

export const reviewService = new ReviewRepository();
