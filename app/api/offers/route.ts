import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sales, categories } from "@/shared";
import { and, desc, eq, gte, lte } from "drizzle-orm";

export async function GET() {
  try {
    const now = new Date();
    
    // Get active sales/offers from database
    const activeSales = await db
      .select({
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
        categoryName: categories.name
      })
      .from(sales)
      .leftJoin(categories, eq(categories.id, sales.categoryId))
      .where(
        and(
          eq(sales.isActive, true),
          gte(sales.validUntil, now),
          lte(sales.validFrom, now)
        )
      )
      .orderBy(desc(sales.isFeatured), desc(sales.createdAt));

    // Get the highest priority offer (featured first)
    const currentOffer = activeSales.length > 0 ? activeSales[0] : null;

    // Format the offer for banner display
    const formattedOffer = currentOffer ? {
      id: currentOffer.id,
      title: formatOfferTitle(currentOffer),
      description: currentOffer.description || formatOfferDescription(currentOffer),
      backgroundColor: getOfferBackgroundColor(currentOffer.offerType),
      textColor: "#ffffff",
      link: currentOffer.categoryId ? `/collections/${currentOffer.categoryName?.toLowerCase()}` : null,
      isActive: currentOffer.isActive,
      priority: currentOffer.isFeatured ? 1 : 2
    } : null;

    return NextResponse.json({
      offer: formattedOffer,
      hasOffer: !!formattedOffer,
      totalActiveOffers: activeSales.length
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
      return `✨ Flat ¥${sale.discountValue} OFF!`;
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
        ? `Get ${sale.discountValue}% off on orders above ¥${sale.minOrderAmount}`
        : `Get ${sale.discountValue}% off on selected items`;
    case 'flat':
      return sale.minOrderAmount 
        ? `Flat ¥${sale.discountValue} off on orders above ¥${sale.minOrderAmount}`
        : `Flat ¥${sale.discountValue} off on selected items`;
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

function getOfferBackgroundColor(offerType: string): string {
  switch (offerType) {
    case 'percentage':
      return '#ef4444'; // red
    case 'flat':
      return '#3b82f6'; // blue  
    case 'flash_sale':
      return '#f59e0b'; // amber
    case 'category':
      return '#10b981'; // green
    default:
      return '#6b7280'; // gray
  }
}
