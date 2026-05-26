import { db } from '@/lib/db';
import { categories, Category, Color, colors, Fabric, fabrics, subcategories, Subcategory } from '@/shared';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// Size ordering: predefined sizes in logical sequence
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

export async function GET(req: NextRequest) {
  try {
    const [categoriesResult, colorsResult, fabricsResult] = await Promise.all([
      getCategoriesWithSubcategories(),
      getColors(),
      getFabrics(),
    ]);

    return NextResponse.json({
      categories: categoriesResult,
      colors: colorsResult,
      fabrics: fabricsResult
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch filters' },
      { status: 500 }
    );
  }
}

async function getCategoriesWithSubcategories(): Promise<(Category & { subcategories: Subcategory[] })[]> {
  const allCategories = await db.select().from(categories).where(eq(categories.isActive, true));
  const allSubcategories = await db.select().from(subcategories).where(eq(subcategories.isActive, true));

  return allCategories.map(category => ({
    ...category,
    sizes: sortSizes(category.sizes),
    subcategories: allSubcategories.filter(sub => sub.categoryId === category.id)
  }));
}

async function getColors(): Promise<Color[]> {
  return db.select().from(colors).where(eq(colors.isActive, true));
}

async function getFabrics(): Promise<Fabric[]> {
  return db.select().from(fabrics).where(eq(fabrics.isActive, true));
}

