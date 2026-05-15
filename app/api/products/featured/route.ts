import { NextRequest, NextResponse } from 'next/server';
import { productService } from '../productService';

export async function GET(req: NextRequest) {
  try {
    const featuredProducts = await productService.getProductsByRole(
      {
        featured: true,
        limit: 8,
        distributionChannel: "online",
      },
      "user"
    );
    return NextResponse.json({ products: featuredProducts });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured products' },
      { status: 500 }
    );
  }
}
