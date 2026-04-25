import { ProductWithDetails } from '@/shared';

export class ProductService {
  private static cache = new Map<string, any>();
  private static cacheTimeout = 5 * 60 * 1000;

  // Generic fetch method with caching
  static async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: { cacheTime?: number }
  ): Promise<T> {
    const cacheKey = key;
    const cached = this.cache.get(cacheKey);
    const cacheTime = options?.cacheTime || this.cacheTimeout;

    // Return cached data if valid
    if (cached && Date.now() - cached.timestamp < cacheTime) {
      return cached.data;
    }

    try {
      const data = await fetcher();

      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error(`Failed to fetch ${key}:`, error);
      throw error;
    }
  }

  // Generic get products method for reuse across all components
  static async getProducts(endpoint: string): Promise<ProductWithDetails[]> {
    return this.fetchWithCache(
      `products-${endpoint}`,
      async () => {
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const response = await fetch(`${baseUrl}/${endpoint}`, {
          cache: "no-store",
        });
        const data = await response.json();
        return data.products || [];
      },
      { cacheTime: 2 * 60 * 1000 } // 2 minutes cache
    );
  }


  // Clear cache
  static clearCache(): void {
    this.cache.clear();
  }
}
