import { NextRequest, NextResponse } from 'next/server';
import { getCachedFeaturedProducts } from './cache';

export async function GET(req: NextRequest) {
  try {
    const featuredProducts = await getCachedFeaturedProducts();
    return NextResponse.json({ products: featuredProducts });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured products' },
      { status: 500 }
    );
  }
}
