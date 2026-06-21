import {
  Coupon,
  coupons,
  couponUsage,
  CouponUsage,
} from "@/shared";
import { and, desc, eq, inArray, sql, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { orderService } from "../orders/orderService";

export interface ICouponsRepository {
  getCoupon(id: string): Promise<Coupon | undefined>;
  getCouponByCode(code: string): Promise<Coupon | undefined>;
  getAvailableCoupons(userId: string, orderAmount?: number): Promise<Coupon[]>;
  validateCoupon(
    couponId: string,
    userId: string,
    orderAmount: number,
  ): Promise<{
    isValid: boolean;
    coupon?: Coupon;
    discountAmount?: number;
    isFreeShipping?: boolean;
    message?: string;
  }>;
  applyCoupon(
    couponId: string,
    userId: string,
    orderId: string,
    discountAmount: string,
  ): Promise<CouponUsage>;
}

/**
 * Batches per-user coupon usage counts in a single query — fixes N+1.
 */
async function batchGetUserUsageCounts(
  couponIds: string[],
  userId: string,
): Promise<Map<string, number>> {
  if (!couponIds.length) return new Map();

  const rows = await db
    .select({
      couponId: couponUsage.couponId,
      count: sql<number>`count(*)`,
    })
    .from(couponUsage)
    .where(
      and(
        inArray(couponUsage.couponId, couponIds),
        eq(couponUsage.userId, userId),
      ),
    )
    .groupBy(couponUsage.couponId);

  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.couponId, Number(row.count));
  }
  return map;
}

export class CouponsRepository implements ICouponsRepository {
  async getCoupon(id: string): Promise<Coupon | undefined> {
    const [result] = await db.select().from(coupons).where(eq(coupons.id, id));
    return result || undefined;
  }

  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    const [result] = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, code.toUpperCase()));
    return result || undefined;
  }

  async getAvailableCoupons(
    userId: string,
    orderAmount?: number,
  ): Promise<Coupon[]> {
    const now = new Date();

    const allCoupons = await db
      .select()
      .from(coupons)
      .where(
        and(
          eq(coupons.isActive, true),
          gte(coupons.validUntil, now),
          lte(coupons.validFrom, now),
        ),
      )
      .orderBy(desc(coupons.createdAt));

    // Batch fetch all per-user usage counts in one query (fixes N+1)
    const couponIds = allCoupons
      .filter((c) => c.perUserLimit)
      .map((c) => c.id);
    const usageMap = await batchGetUserUsageCounts(couponIds, userId);

    const availableCoupons: Coupon[] = [];

    for (const coupon of allCoupons) {
      // Check global usage limit
      if (coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit) {
        continue;
      }

      // Check per-user limit using batched map
      if (coupon.perUserLimit) {
        const userCount = usageMap.get(coupon.id) ?? 0;
        if (userCount >= coupon.perUserLimit) {
          continue;
        }
      }

      // Check minimum order amount
      if (
        orderAmount &&
        coupon.minOrderAmount &&
        orderAmount < Number(coupon.minOrderAmount)
      ) {
        continue;
      }

      availableCoupons.push(coupon);
    }

    return availableCoupons;
  }

  async getCouponsWithUsageStatus(
    userId: string,
    orderAmount?: number,
  ): Promise<{
    available: Coupon[];
    used: Coupon[];
  }> {
    const now = new Date();

    const allCoupons = await db
      .select()
      .from(coupons)
      .where(
        and(
          eq(coupons.isActive, true),
          gte(coupons.validUntil, now),
          lte(coupons.validFrom, now),
        ),
      )
      .orderBy(desc(coupons.createdAt));

    // Batch fetch all per-user usage counts in one query (fixes N+1)
    const allCouponIds = allCoupons.map((c) => c.id);
    const usageMap = await batchGetUserUsageCounts(allCouponIds, userId);

    const availableCoupons: Coupon[] = [];
    const usedCoupons: Coupon[] = [];

    for (const coupon of allCoupons) {
      const usageCount = usageMap.get(coupon.id) ?? 0;
      const isUsedByUser = usageCount > 0;
      const isUsageLimitReached = coupon.perUserLimit
        ? usageCount >= coupon.perUserLimit
        : false;
      const isGlobalLimitReached = coupon.usageLimit
        ? (coupon.usedCount || 0) >= coupon.usageLimit
        : false;
      const failsMinOrder =
        orderAmount &&
        coupon.minOrderAmount &&
        orderAmount < Number(coupon.minOrderAmount);

      if (
        isUsedByUser ||
        isUsageLimitReached ||
        isGlobalLimitReached ||
        failsMinOrder
      ) {
        usedCoupons.push(coupon);
      } else {
        availableCoupons.push(coupon);
      }
    }

    return { available: availableCoupons, used: usedCoupons };
  }

  async validateCoupon(
    couponId: string,
    userId: string,
    orderAmount: number,
  ): Promise<{
    isValid: boolean;
    coupon?: Coupon;
    discountAmount?: number;
    isFreeShipping?: boolean;
    message?: string;
  }> {
    const coupon = await this.getCoupon(couponId);

    if (!coupon) {
      return { isValid: false, message: "Coupon not found" };
    }

    if (!coupon.isActive) {
      return { isValid: false, message: "Coupon is not active" };
    }

    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);

    if (now < validFrom || now > validUntil) {
      return { isValid: false, message: "Coupon has expired" };
    }

    if (coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit) {
      return { isValid: false, message: "Coupon usage limit reached" };
    }

    if (coupon.perUserLimit) {
      const [row] = await db
        .select({ count: sql<number>`count(*)` })
        .from(couponUsage)
        .where(
          and(
            eq(couponUsage.couponId, couponId),
            eq(couponUsage.userId, userId),
          ),
        );

      if (Number(row?.count ?? 0) >= coupon.perUserLimit) {
        return {
          isValid: false,
          message: "You have reached the usage limit for this coupon",
        };
      }
    }

    if (coupon.minOrderAmount && orderAmount < Number(coupon.minOrderAmount)) {
      return {
        isValid: false,
        message: `Minimum order amount of ₹${coupon.minOrderAmount} required`,
      };
    }

    // Calculate discount — free_shipping coupons return 0 discount with isFreeShipping flag
    let discountAmount = 0;
    let isFreeShipping = false;

    if (coupon.type === "percentage") {
      discountAmount = (orderAmount * Number(coupon.value)) / 100;
    } else if (coupon.type === "fixed") {
      discountAmount = Number(coupon.value);
    } else if (coupon.type === "free_shipping") {
      isFreeShipping = true;
    }

    // Apply maximum discount cap
    if (coupon.maxDiscount && discountAmount > Number(coupon.maxDiscount)) {
      discountAmount = Number(coupon.maxDiscount);
    }

    return { isValid: true, coupon, discountAmount, isFreeShipping };
  }

  async applyCoupon(
    couponId: string,
    userId: string,
    orderId: string,
    discountAmount: string,
  ): Promise<CouponUsage> {
    return await db.transaction(async (trx) => {
      const [usageResult] = await trx
        .insert(couponUsage)
        .values({ couponId, userId, orderId, discountAmount })
        .returning();

      await trx
        .update(coupons)
        .set({ usedCount: sql`${coupons.usedCount} + 1` })
        .where(eq(coupons.id, couponId));

      return usageResult;
    });
  }

  async createOrderWithCoupon(
    orderData: any,
    orderItems: any[],
    couponId?: string,
    userId?: string,
    discountAmount?: string,
    initialItemStatus: string = "pending",
  ) {
    return await db.transaction(async (trx) => {
      let couponDetails = null;
      if (couponId) {
        const [coupon] = await trx
          .select()
          .from(coupons)
          .where(eq(coupons.id, couponId));
        couponDetails = coupon;
      }

      const enhancedOrderData = {
        ...orderData,
        couponCode: couponDetails?.code || null,
        couponType: couponDetails?.type || null,
        couponValue: couponDetails?.value || null,
      };

      const order = await orderService.createOrderWithTransaction(
        trx,
        enhancedOrderData,
        orderItems,
        initialItemStatus,
      );

      if (couponId && userId && discountAmount && parseFloat(discountAmount) > 0) {
        await this.applyCouponWithTransaction(
          trx,
          couponId,
          userId,
          order.id,
          discountAmount,
        );
      }

      return order;
    });
  }

  private async applyCouponWithTransaction(
    trx: any,
    couponId: string,
    userId: string,
    orderId: string,
    discountAmount: string,
  ): Promise<CouponUsage> {
    const [usageResult] = await trx
      .insert(couponUsage)
      .values({ couponId, userId, orderId, discountAmount })
      .returning();

    await trx
      .update(coupons)
      .set({ usedCount: sql`${coupons.usedCount} + 1` })
      .where(eq(coupons.id, couponId));

    return usageResult;
  }
}

export const couponsService = new CouponsRepository();
