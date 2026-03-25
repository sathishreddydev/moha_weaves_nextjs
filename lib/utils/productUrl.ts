/**
 * Generates product URL using the same structure as ProductCard
 * @param product - Product object with category and urlSlug/id
 * @returns Product URL string
 */
export function getProductUrl(product: any): string {
  const category = product.category?.name?.toLowerCase() || "ethnic-wear";
  const slug = product.urlSlug || product.id;
  return `/collections/${category}/${slug}`;
}
