import { NextRequest, NextResponse } from 'next/server';
import { productService, RoleBasedProductService } from '../productService';

export async function GET(req: NextRequest) {
  try {
    
    // Get products created in the last 30 days as "new"
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newProducts = await productService.getProductsByRole(
      { 
        limit: 8,
        distributionChannel: "online", // Only show products available online
        // We'll need to add date filtering to the service or handle it here
      },
      "user"
    );

    // Filter by creation date (client-side filtering for now)
    const filteredNewProducts = newProducts.filter(product => {
      const createdDate = new Date(product.createdAt);
      return createdDate >= thirtyDaysAgo;
    });

    return NextResponse.json({ products: filteredNewProducts });
  } catch (error) {
    console.error('Error fetching new products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch new products' },
      { status: 500 }
    );
  }
}
