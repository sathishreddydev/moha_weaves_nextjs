import { ProductWithDetails } from "@/shared";

export class ProductService {
  // Generic get products method for reuse across all components
  static async getProducts(endpoint: string, revalidate: number = 60): Promise<ProductWithDetails[]> {
    const response = await fetch(`${endpoint}`, {
      next: { revalidate }, // Cache for 60s by default, revalidate periodically
    });
    const data = await response.json();
    return data.products || [];
  }
}
