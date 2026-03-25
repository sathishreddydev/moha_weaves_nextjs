import { unstable_cache } from 'next/cache';
import { productService } from '../productService';

// Cached version of featured products API
const getCachedFeaturedProducts = unstable_cache(
  async () => {
    return await productService.getProductsByRole(
      { 
        featured: true, 
        limit: 8,
        distributionChannel: "online"
      },
      "user"
    );
  },
  ['featured-products'],
  {
    revalidate: 300, // 5 minutes
    tags: ['products', 'featured'],
  }
);

export { getCachedFeaturedProducts };
