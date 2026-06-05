import { db } from '@/lib/db';
import { categories, Category, colors, Color, fabrics, Fabric, subcategories, Subcategory } from '@/shared';
import { eq } from 'drizzle-orm';

export type FiltersData = {
  categories: (Category & { subcategories: Subcategory[] })[];
  colors: Color[];
  fabrics: Fabric[];
};

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

function sortSizes(sizes: string[] | null): string[] {
  if (!sizes || !sizes.length) return sizes || [];
  return [...sizes].sort((a, b) => {
    const indexA = SIZE_ORDER.indexOf(a);
    const indexB = SIZE_ORDER.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });
}

export async function getFiltersData(): Promise<FiltersData> {
  const [allCategories, allSubcategories, colorsResult, fabricsResult] =
    await Promise.all([
      db.select().from(categories).where(eq(categories.isActive, true)),
      db.select().from(subcategories).where(eq(subcategories.isActive, true)),
      db.select().from(colors).where(eq(colors.isActive, true)),
      db.select().from(fabrics).where(eq(fabrics.isActive, true)),
    ]);

  const categoriesWithSubs = allCategories.map((category) => ({
    ...category,
    sizes: sortSizes(category.sizes),
    subcategories: allSubcategories.filter((sub) => sub.categoryId === category.id),
  }));

  return {
    categories: categoriesWithSubs,
    colors: colorsResult,
    fabrics: fabricsResult,
  };
}
