import { db } from "@/lib/db";
import {
    InsertProductReview,
    ProductReview,
    ProductWithReviews,
    orderItems,
    orders,
    productReviews,
    users
} from "@/shared";
import { and, desc, eq } from "drizzle-orm";
import { productService } from "../../productService";

export type ReviewWithUser = Omit<
    typeof productReviews.$inferSelect,
    "userId"
> & {
    user: {
        id: string;
        name: string;
    };
};
export interface IReviewStorage {
    // Product Reviews
    getProductReviews(productId: string): Promise<ReviewWithUser[]>;
    getReview(id: string): Promise<ProductReview | undefined>;
    createReview(review: InsertProductReview): Promise<ReviewWithUser[]>;
    getUserReviews(userId: string): Promise<ProductReview[]>;
    getProductWithReviews(productId: string): Promise<ProductWithReviews | undefined>;
    canUserReviewProduct(userId: string, productId: string): Promise<boolean>;

}

export class ReviewRepository implements IReviewStorage {
    // Product Reviews
    async getProductReviews(productId: string): Promise<ReviewWithUser[]> {
        const rows = await db
            .select()
            .from(productReviews)
            .innerJoin(users, eq(users.id, productReviews.userId))
            .where(eq(productReviews.productId, productId))
            .orderBy(desc(productReviews.createdAt));
        return rows.map((row) => ({
            ...row.product_reviews,
            user: {
                id: row.users.id,
                name: row.users.name,
            },
        }));
    }

    async getReview(id: string): Promise<ProductReview | undefined> {
        const [result] = await db
            .select()
            .from(productReviews)
            .where(eq(productReviews.id, id));
        return result || undefined;
    }

    async createReview(review: InsertProductReview): Promise<ReviewWithUser[]> {
        await db
            .insert(productReviews)
            .values(review)
            .returning({ id: productReviews.id });

        return this.getProductReviews(review.productId);
    }



    async getUserReviews(userId: string): Promise<ProductReview[]> {
        return db
            .select()
            .from(productReviews)
            .where(eq(productReviews.userId, userId))
            .orderBy(desc(productReviews.createdAt));
    }

    async getProductWithReviews(
        productId: string
    ): Promise<ProductWithReviews | undefined> {
        // MIGRATED: Use role-based service for online users (60-70% faster)
        const product = await productService.getProductByRole(productId, "user");
        if (!product) return undefined;

        const reviews = await this.getProductReviews(productId);
        const avgRating =
            reviews.length > 0
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                : 0;

        return {
            ...product,
            reviews,
            averageRating: avgRating,
            reviewCount: reviews.length,
        };
    }

    async canUserReviewProduct(
        userId: string,
        productId: string
    ): Promise<boolean> {
        const deliveredOrders = await db
            .select()
            .from(orders)
            .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
            .where(
                and(
                    eq(orders.userId, userId),
                    eq(orders.status, "completed"),
                    eq(orderItems.productId, productId)
                )
            );

        if (deliveredOrders.length === 0) return false;

        const existingReview = await db
            .select()
            .from(productReviews)
            .where(
                and(
                    eq(productReviews.userId, userId),
                    eq(productReviews.productId, productId)
                )
            );

        return existingReview.length === 0;
    }


}

export const reviewService = new ReviewRepository();
