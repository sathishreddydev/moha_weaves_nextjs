import { productService } from "@/app/api/products/productService";
import { isNewProduct } from "@/lib/stock-utils";
import { ProductWithDetails } from "@/shared";

export async function getFeaturedProducts(): Promise<ProductWithDetails[]> {
  return productService.getProductsByRole(
    { featured: true, limit: 8, distributionChannel: "online" },
    "user"
  );
}

export async function getNewProducts(): Promise<ProductWithDetails[]> {
  // Fetch a larger pool (32) before filtering by recency so we don't
  // accidentally return 0 results when only the first 8 happen to be old.
  const all = await productService.getProductsByRole(
    { limit: 32, distributionChannel: "online" },
    "user"
  );
  return all.filter((p) => isNewProduct(p.createdAt)).slice(0, 8);
}
