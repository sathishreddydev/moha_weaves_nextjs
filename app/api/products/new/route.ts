import { NextRequest, NextResponse } from 'next/server';
import { productService, RoleBasedProductService } from '../productService';
import { isNewProduct } from '@/lib/stock-utils';

export async function GET(req: NextRequest) {
  try {

    // Get all online products and filter for new ones using common utility
    const newProducts = await productService.getProductsByRole(
      {
        limit: 8,
        distributionChannel: "online", // Only show products available online
      },
      "user"
    );

    // Filter by creation date using common isNewProduct function
    const filteredNewProducts = newProducts.filter(product => 
      isNewProduct(product.createdAt)
    );

    return NextResponse.json({ products: filteredNewProducts });
  } catch (error) {
    console.error('Error fetching new products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch new products' },
      { status: 500 }
    );
  }
}
