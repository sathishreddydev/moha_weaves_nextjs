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
  const all = await productService.getProductsByRole(
    { limit: 8, distributionChannel: "online" },
    "user"
  );
  return all.filter((p) => isNewProduct(p.createdAt));
}
