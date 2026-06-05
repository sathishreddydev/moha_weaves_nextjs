import { db } from "@/lib/db";
import { sales, categories } from "@/shared";
import { and, desc, eq, gte, lte } from "drizzle-orm";

export interface Offer {
  id: string;
  title: string;
  description: string;
  backgroundColor: string;
  textColor: string;
  link: string | null;
  isActive: boolean;
  isFeatured: boolean;
  validFrom: Date;
  validUntil: Date;
}

function formatOfferTitle(sale: any): string {
  switch (sale.offerType) {
    case "percentage":
      return `🎉 ${sale.discountValue}% OFF!`;
    case "flat":
      return `✨ Flat ₹${sale.discountValue} OFF!`;
    case "flash_sale":
      return `⚡ Flash Sale!`;
    case "category":
      return `🛍️ ${sale.categoryName || "Category"} Sale!`;
    default:
      return sale.name || "Special Offer!";
  }
}

function formatOfferDescription(sale: any): string {
  switch (sale.offerType) {
    case "percentage":
      return sale.minOrderAmount
        ? `Get ${sale.discountValue}% off on orders above ₹${sale.minOrderAmount}`
        : `Get ${sale.discountValue}% off on selected items`;
    case "flat":
      return sale.minOrderAmount
        ? `Flat ₹${sale.discountValue} off on orders above ₹${sale.minOrderAmount}`
        : `Flat ₹${sale.discountValue} off on selected items`;
    case "flash_sale":
      return `Limited time offer - Don't miss out!`;
    case "category":
      return sale.categoryName
        ? `Special discounts on ${sale.categoryName}`
        : `Special discounts on selected categories`;
    default:
      return "Special discounts available";
  }
}

function formatOffer(offer: any): Offer {
  let link: string | null = null;
  if (offer.categoryId && offer.categoryName) {
    link = `/collections/${offer.categoryName.toLowerCase()}?onSale=true`;
  } else if (
    offer.offerType === "flash_sale" ||
    offer.offerType === "percentage" ||
    offer.offerType === "flat"
  ) {
    link = `/collections?onSale=true`;
  }

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
}

/**
 * Returns only the active offers needed for the banner.
 * Called directly on the server — no HTTP round-trip.
 */
export async function getActiveOffers(): Promise<Offer[]> {
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

  return activeSales.map(formatOffer);
}
