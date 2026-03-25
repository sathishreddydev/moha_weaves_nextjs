import {
    Coupon,
    coupons,
    couponUsage,
    CouponUsage,
    CouponWithUsage,
    InsertCoupon,
} from "@/shared";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";

export interface ICouponsRepository {
    // Coupons
    getCoupon(id: string): Promise<Coupon | undefined>;

    applyCoupon(
        couponId: string,
        userId: string,
        orderId: string,
        discountAmount: string
    ): Promise<CouponUsage>;
}
export class CouponsRepository implements ICouponsRepository {
    // Coupons


    async getCoupon(id: string): Promise<Coupon | undefined> {
        const [result] = await db.select().from(coupons).where(eq(coupons.id, id));
        return result || undefined;
    }




    async applyCoupon(
        couponId: string,
        userId: string,
        orderId: string,
        discountAmount: string
    ): Promise<CouponUsage> {
        const [result] = await db
            .insert(couponUsage)
            .values({
                couponId,
                userId,
                orderId,
                discountAmount,
            })
            .returning();
        return result;
    }
}

export const couponsService = new CouponsRepository();
