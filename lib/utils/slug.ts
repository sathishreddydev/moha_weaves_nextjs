/**
 * Convert a string to a URL-friendly slug
 * @param text - The text to convert
 * @returns URL-friendly slug
 */
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Convert a slug back to a readable name (approximate)
 * @param slug - The slug to convert
 * @returns Readable name
 */
export function slugToName(slug: string): string {
  if (!slug) return '';
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Create a category URL with name-based slug
 * @param categoryName - The category name
 * @param categoryId - The category ID (for backend)
 * @returns URL object with slug and metadata
 */
export function createCategoryUrl(categoryName: string, categoryId: string) {
  const slug = createSlug(categoryName);
  return {
    url: `/collections?category=${slug}`,
    slug,
    categoryId,
    categoryName
  };
}
