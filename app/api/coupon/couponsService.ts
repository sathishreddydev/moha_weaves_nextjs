import {
    Coupon,
    coupons,
    couponUsage,
    CouponUsage,
    CouponWithUsage,
    InsertCoupon,
} from "@/shared";
import { and, desc, eq, sql, gte, lte, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { orderService } from "../orders/orderService";

export interface ICouponsRepository {
    // Coupons
    getCoupon(id: string): Promise<Coupon | undefined>;
    getCouponByCode(code: string): Promise<Coupon | undefined>;
    getAvailableCoupons(userId: string, orderAmount?: number): Promise<Coupon[]>;
    validateCoupon(couponId: string, userId: string, orderAmount: number): Promise<{
        isValid: boolean;
        coupon?: Coupon;
        discountAmount?: number;
        message?: string;
    }>;

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

    async getCouponByCode(code: string): Promise<Coupon | undefined> {
        const [result] = await db.select().from(coupons).where(eq(coupons.code, code.toUpperCase()));
        return result || undefined;
    }

    async getAvailableCoupons(userId: string, orderAmount?: number): Promise<Coupon[]> {
        const now = new Date();
        
        // Get all active coupons that are currently valid
        const allCoupons = await db
            .select()
            .from(coupons)
            .where(
                and(
                    eq(coupons.isActive, true),
                    gte(coupons.validUntil, now),
                    lte(coupons.validFrom, now)
                )
            )
            .orderBy(desc(coupons.createdAt));

        const availableCoupons: Coupon[] = [];

        for (const coupon of allCoupons) {
            // Check usage limit
            if (coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit) {
                continue;
            }

            // Check per-user limit
            if (coupon.perUserLimit) {
                const userUsageCount = await db
                    .select({ count: sql<number>`count(*)` })
                    .from(couponUsage)
                    .where(and(
                        eq(couponUsage.couponId, coupon.id),
                        eq(couponUsage.userId, userId)
                    ));
                
                if (userUsageCount[0]?.count >= coupon.perUserLimit) {
                    continue;
                }
            }

            // Check minimum order amount if provided
            if (orderAmount && coupon.minOrderAmount && orderAmount < Number(coupon.minOrderAmount)) {
                continue;
            }

            availableCoupons.push(coupon);
        }

        return availableCoupons;
    }

    async getCouponsWithUsageStatus(userId: string, orderAmount?: number): Promise<{
        available: Coupon[];
        used: Coupon[];
    }> {
        const now = new Date();
        
        // Get all active coupons that are currently valid
        const allCoupons = await db
            .select()
            .from(coupons)
            .where(
                and(
                    eq(coupons.isActive, true),
                    gte(coupons.validUntil, now),
                    lte(coupons.validFrom, now)
                )
            )
            .orderBy(desc(coupons.createdAt));

        const availableCoupons: Coupon[] = [];
        const usedCoupons: Coupon[] = [];

        for (const coupon of allCoupons) {
            // Get user usage count for this coupon
            const userUsageCount = await db
                .select({ count: sql<number>`count(*)` })
                .from(couponUsage)
                .where(and(
                    eq(couponUsage.couponId, coupon.id),
                    eq(couponUsage.userId, userId)
                ));

            const usageCount = userUsageCount[0]?.count || 0;
            const isUsedByUser = usageCount > 0;
            const isUsageLimitReached = coupon.perUserLimit ? usageCount >= coupon.perUserLimit : false;
            const isGlobalLimitReached = coupon.usageLimit ? (coupon.usedCount || 0) >= coupon.usageLimit : false;
            const failsMinOrder = orderAmount && coupon.minOrderAmount && orderAmount < Number(coupon.minOrderAmount);

            if (isUsedByUser || isUsageLimitReached || isGlobalLimitReached || failsMinOrder) {
                usedCoupons.push(coupon);
            } else {
                availableCoupons.push(coupon);
            }
        }

        return {
            available: availableCoupons,
            used: usedCoupons
        };
    }

    async validateCoupon(couponId: string, userId: string, orderAmount: number): Promise<{
        isValid: boolean;
        coupon?: Coupon;
        discountAmount?: number;
        message?: string;
    }> {
        const coupon = await this.getCoupon(couponId);
        
        if (!coupon) {
            return { isValid: false, message: "Coupon not found" };
        }

        // Check if coupon is active
        if (!coupon.isActive) {
            return { isValid: false, message: "Coupon is not active" };
        }

        // Check date validity
        const now = new Date();
        const validFrom = new Date(coupon.validFrom);
        const validUntil = new Date(coupon.validUntil);

        if (now < validFrom || now > validUntil) {
            return { isValid: false, message: "Coupon has expired" };
        }

        // Check usage limit
        if (coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit) {
            return { isValid: false, message: "Coupon usage limit reached" };
        }

        // Check per-user limit
        if (coupon.perUserLimit) {
            const userUsageCount = await db
                .select({ count: sql<number>`count(*)` })
                .from(couponUsage)
                .where(and(
                    eq(couponUsage.couponId, couponId),
                    eq(couponUsage.userId, userId)
                ));
            
            const usageCount = userUsageCount[0]?.count || 0;
            
            if (usageCount >= coupon.perUserLimit) {
                return { isValid: false, message: "You have reached the usage limit for this coupon" };
            }
        }

        // Check minimum order amount
        if (coupon.minOrderAmount && orderAmount < Number(coupon.minOrderAmount)) {
            return { 
                isValid: false, 
                message: `Minimum order amount of ₹${coupon.minOrderAmount} required` 
            };
        }

        // Calculate discount
        let discountAmount = 0;
        
        if (coupon.type === "percentage") {
            discountAmount = (orderAmount * Number(coupon.value)) / 100;
        } else if (coupon.type === "fixed") {
            discountAmount = Number(coupon.value);
        } else if (coupon.type === "free_shipping") {
            // For free shipping, discount is the shipping cost (assuming ₹50)
            discountAmount = orderAmount >= 999 ? 0 : 50;
        }

        // Apply maximum discount cap
        if (coupon.maxDiscount && discountAmount > Number(coupon.maxDiscount)) {
            discountAmount = Number(coupon.maxDiscount);
        }

        return {
            isValid: true,
            coupon,
            discountAmount
        };
    }




    async applyCoupon(
        couponId: string,
        userId: string,
        orderId: string,
        discountAmount: string
    ): Promise<CouponUsage> {
        return await db.transaction(async (trx) => {
            // Create coupon usage record
            const [usageResult] = await trx
                .insert(couponUsage)
                .values({
                    couponId,
                    userId,
                    orderId,
                    discountAmount,
                })
                .returning();

            // Increment coupon usedCount
            await trx
                .update(coupons)
                .set({ 
                    usedCount: sql`${coupons.usedCount} + 1` 
                })
                .where(eq(coupons.id, couponId));

            return usageResult;
        });
    }

    async createOrderWithCoupon(
        orderData: any,
        orderItems: any[],
        couponId?: string,
        userId?: string,
        discountAmount?: string
    ) {
        return await db.transaction(async (trx) => {
            try {
                // Create order first
                const order = await orderService.createOrderWithTransaction(trx, orderData, orderItems);
                
                // Apply coupon if provided
                if (couponId && userId && discountAmount && parseFloat(discountAmount) > 0) {
                    await this.applyCouponWithTransaction(trx, couponId, userId, order.id, discountAmount);
                }
                
                return order;
            } catch (error) {
                // Transaction will automatically rollback on error
                throw error;
            }
        });
    }

    private async applyCouponWithTransaction(
        trx: any,
        couponId: string,
        userId: string,
        orderId: string,
        discountAmount: string
    ): Promise<CouponUsage> {
        // Create coupon usage record
        const [usageResult] = await trx
            .insert(couponUsage)
            .values({
                couponId,
                userId,
                orderId,
                discountAmount,
            })
            .returning();

        // Increment coupon usedCount
        await trx
            .update(coupons)
            .set({ 
                usedCount: sql`${coupons.usedCount} + 1` 
            })
            .where(eq(coupons.id, couponId));

        return usageResult;
    }
}

export const couponsService = new CouponsRepository();
