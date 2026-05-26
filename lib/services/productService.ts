import { ProductWithDetails } from "@/shared";

export class ProductService {
  // Generic get products method for reuse across all components
  static async getProducts(endpoint: string): Promise<ProductWithDetails[]> {
    const response = await fetch(`${endpoint}`, {
      cache: "no-store",
    });
    const data = await response.json();
    return data.products || [];
  }
}
