import { db } from "@/lib/db";
import { categories, sales } from "@/shared";
import { desc, eq, gte, lte, not, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getActiveOffers } from "./offersService";

export async function GET() {
  try {
    const now = new Date();

    const selectFields = {
      id: sales.id,
      name: sales.name,
      description: sales.description,
      offerType: sales.offerType,
      discountValue: sales.discountValue,
      categoryId: sales.categoryId,
      minOrderAmount: sales.minOrderAmount,
      maxDiscount: sales.maxDiscount,
      validFrom: sales.validFrom,
      validUntil: sales.validUntil,
      isActive: sales.isActive,
      isFeatured: sales.isFeatured,
      bannerImage: sales.bannerImage,
      bgColor: sales.bgColor,
      categoryName: categories.name,
      createdAt: sales.createdAt,
    };

    // Active offers via shared service
    const activeOffers = await getActiveOffers();

    // Inactive offers still needed for the full API response (admin UI etc.)
    const inactiveSales = await db
      .select(selectFields)
      .from(sales)
      .leftJoin(categories, eq(categories.id, sales.categoryId))
      .where(
        or(
          not(eq(sales.isActive, true)),
          gte(sales.validFrom, now),
          lte(sales.validUntil, now),
        ),
      )
      .orderBy(desc(sales.createdAt));

    const formatInactive = (offer: any) => ({
      id: offer.id,
      title: offer.name || "Special Offer!",
      description: offer.description || "",
      backgroundColor: offer.bgColor || "#1f2937",
      textColor: "#ffffff",
      link: null,
      isActive: offer.isActive,
      isFeatured: offer.isFeatured,
      validFrom: offer.validFrom,
      validUntil: offer.validUntil,
    });

    return NextResponse.json({
      offer: activeOffers[0] ?? null,
      activeOffers,
      inactiveOffers: inactiveSales.map(formatInactive),
      hasOffer: activeOffers.length > 0,
      totalActiveOffers: activeOffers.length,
      totalOffers: activeOffers.length + inactiveSales.length,
    });
  } catch (error) {
    console.error("Error fetching offers:", error);
    return NextResponse.json(
      { message: "Failed to fetch offers" },
      { status: 500 },
    );
  }
}
