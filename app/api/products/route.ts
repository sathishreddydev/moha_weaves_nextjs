import { NextRequest, NextResponse } from 'next/server';
import { RoleBasedProductService, ProductFilters, productService } from './productService';
import { unstable_cache } from 'next/cache';


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const filters: ProductFilters = {
      search: searchParams.get('search') || undefined,
      sku: searchParams.get('sku') || undefined,
      categories: searchParams.get('categories')?.split(',').filter(Boolean) || undefined,
      subcategories: searchParams.get('subcategories')?.split(',').filter(Boolean) || undefined,
      colors: searchParams.get('colors')?.split(',').filter(Boolean) || undefined,
      fabrics: searchParams.get('fabrics')?.split(',').filter(Boolean) || undefined,
      featured: searchParams.get('featured') === 'true',
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      distributionChannel: searchParams.get('distributionChannel') as 'shop' | 'online' | 'both' || undefined,
      sort: searchParams.get('sort') || undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
      offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined,
      onSale: searchParams.get('onSale') === 'true',
      ids: searchParams.get('ids')?.split(',').filter(Boolean) || undefined,
      storeId: searchParams.get('storeId') || undefined,
      size: searchParams.get('size')?.split(',').filter(Boolean) || undefined,
      inStock: searchParams.get('inStock') === 'true',
      minStock: searchParams.get('minStock') ? Number(searchParams.get('minStock')) : undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean) || undefined,
    };

    // Get user role (you can modify this based on your auth system)
    const role = searchParams.get('role') === 'admin' ? 'admin' : 'user';

    const products = await productService.getProductsByRole(filters, role);

    return NextResponse.json({
      success: true,
      data: products,
      count: products.length,
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch products',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Parse filters from request body
    const filters: ProductFilters = {
      search: body.search,
      sku: body.sku,
      categories: body.categories,
      subcategories: body.subcategories,
      colors: body.colors,
      fabrics: body.fabrics,
      featured: body.featured,
      minPrice: body.minPrice,
      maxPrice: body.maxPrice,
      distributionChannel: body.distributionChannel,
      sort: body.sort,
      limit: body.limit,
      offset: body.offset,
      onSale: body.onSale,
      ids: body.ids,
      storeId: body.storeId,
      size: body.size,
      inStock: body.inStock,
      minStock: body.minStock,
      tags: body.tags,
    };

    // Check if this is a cached request (from initial page load)
    const useCache = body.useCache === true;
    
    if (useCache) {
      // Use cached version for static data
      const cachedProducts = await getCachedProductsData(filters);
      return NextResponse.json({
        success: true,
        data: cachedProducts,
        count: cachedProducts.length,
      });
    }

    const products = await productService.getProductsByRole(filters, 'user');

    return NextResponse.json({
      success: true,
      data: products,
      count: products.length,
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch products',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Cached version for static product data
const getCachedProductsData = unstable_cache(
  async (filters: ProductFilters) => {
    return await productService.getProductsByRole(filters, 'user');
  },
  ['products-data'],
  {
    revalidate: 300, // 5 minutes
    tags: ['products'],
  }
);
