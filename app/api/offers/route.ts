import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sales, categories } from "@/shared";
import { and, desc, eq, gte, lte, or, not } from "drizzle-orm";

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

    // ✅ Fetch active offers with SQL filtering (no JS post-filter)
    const activeSales = await db
      .select(selectFields)
      .from(sales)
      .leftJoin(categories, eq(categories.id, sales.categoryId))
      .where(
        and(
          eq(sales.isActive, true),
          lte(sales.validFrom, now),
          gte(sales.validUntil, now)
        )
      )
      .orderBy(desc(sales.isFeatured), desc(sales.createdAt));

    // ✅ Fetch inactive offers separately
    const inactiveSales = await db
      .select(selectFields)
      .from(sales)
      .leftJoin(categories, eq(categories.id, sales.categoryId))
      .where(
        or(
          not(eq(sales.isActive, true)),
          gte(sales.validFrom, now),
          lte(sales.validUntil, now)
        )
      )
      .orderBy(desc(sales.createdAt));

    // ✅ Pick best offer (featured already sorted)
    const currentOffer = activeSales?.[0] || null;

    // ✅ Formatter
    const formatOffer = (offer: any) => {
      // Build the destination link for the offer
      let link: string | null = null;
      if (offer.categoryId && offer.categoryName) {
        // Category-scoped offer → go to that category pre-filtered to on-sale items
        link = `/collections/${offer.categoryName.toLowerCase()}?onSale=true`;
      } else if (offer.offerType === "flash_sale" || offer.offerType === "percentage" || offer.offerType === "flat") {
        // Sitewide offer → go to all collections filtered to on-sale items
        link = `/collections?onSale=true`;
      }
      // product-level offers without a category get no link (handled per-product)

      return {
        id: offer.id,
        title: formatOfferTitle(offer),
        description: offer.description || formatOfferDescription(offer),
        backgroundColor: offer.bgColor || "#1f2937",
        textColor: "#ffffff",
        link,
        isActive: offer.isActive,
        isFeatured: offer.isFeatured,
        validFrom: offer.validFrom,
        validUntil: offer.validUntil,
      };
    };

    const formattedOffer = currentOffer
      ? formatOffer(currentOffer)
      : null;

    return NextResponse.json({
      // ✅ single banner
      offer: formattedOffer,

      // ✅ lists
      activeOffers: activeSales.map(formatOffer),
      inactiveOffers: inactiveSales.map(formatOffer),

      hasOffer: Boolean(formattedOffer),
      totalActiveOffers: activeSales.length,
      totalOffers: activeSales.length + inactiveSales.length,
    });
  } catch (error) {
    console.error("Error fetching offers:", error);

    return NextResponse.json(
      { message: "Failed to fetch offers" },
      { status: 500 }
    );
  }
}

function formatOfferTitle(sale: any): string {
  switch (sale.offerType) {
    case 'percentage':
      return `🎉 ${sale.discountValue}% OFF!`;
    case 'flat':
      return `✨ Flat ₹${sale.discountValue} OFF!`;
    case 'flash_sale':
      return `⚡ Flash Sale!`;
    case 'category':
      return `🛍️ ${sale.categoryName || 'Category'} Sale!`;
    default:
      return sale.name || 'Special Offer!';
  }
}

function formatOfferDescription(sale: any): string {
  switch (sale.offerType) {
    case 'percentage':
      return sale.minOrderAmount
        ? `Get ${sale.discountValue}% off on orders above ₹${sale.minOrderAmount}`
        : `Get ${sale.discountValue}% off on selected items`;
    case 'flat':
      return sale.minOrderAmount
        ? `Flat ₹${sale.discountValue} off on orders above ₹${sale.minOrderAmount}`
        : `Flat ₹${sale.discountValue} off on selected items`;
    case 'flash_sale':
      return `Limited time offer - Don't miss out!`;
    case 'category':
      return sale.categoryName
        ? `Special discounts on ${sale.categoryName}`
        : `Special discounts on selected categories`;
    default:
      return 'Special discounts available';
  }
}

