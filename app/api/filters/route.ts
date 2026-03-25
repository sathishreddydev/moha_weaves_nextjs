import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { categories, subcategories, colors, fabrics, Category, Color, Fabric, Subcategory } from '@/shared';
import { unstable_cache } from 'next/cache';

export async function GET(req: NextRequest) {
  try {
    const [categoriesResult, colorsResult, fabricsResult] = await Promise.all([
      getCachedCategoriesWithSubcategories(),
      getCachedColors(),
      getCachedFabrics(),
    ]);

    return NextResponse.json({
      categories: categoriesResult,
      colors: colorsResult,
      fabrics: fabricsResult
    });
  } catch (error) {
    console.error('Error fetching filters:', error);
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
    subcategories: allSubcategories.filter(sub => sub.categoryId === category.id)
  }));
}

async function getColors(): Promise<Color[]> {
  return db.select().from(colors).where(eq(colors.isActive, true));
}

async function getFabrics(): Promise<Fabric[]> {
  return db.select().from(fabrics).where(eq(fabrics.isActive, true));
}

// Cached versions of the filter functions
const getCachedCategoriesWithSubcategories = unstable_cache(
  async () => {
    const allCategories = await db.select().from(categories).where(eq(categories.isActive, true));
    const allSubcategories = await db.select().from(subcategories).where(eq(subcategories.isActive, true));

    return allCategories.map(category => ({
      ...category,
      subcategories: allSubcategories.filter(sub => sub.categoryId === category.id)
    }));
  },
  ['categories-with-subcategories'],
  {
    revalidate: 3600, // 1 hour - categories don't change often
    tags: ['filters'],
  }
);

const getCachedColors = unstable_cache(
  async () => {
    return db.select().from(colors).where(eq(colors.isActive, true));
  },
  ['colors'],
  {
    revalidate: 3600, // 1 hour - colors don't change often
    tags: ['filters'],
  }
);

const getCachedFabrics = unstable_cache(
  async () => {
    return db.select().from(fabrics).where(eq(fabrics.isActive, true));
  },
  ['fabrics'],
  {
    revalidate: 3600, // 1 hour - fabrics don't change often
    tags: ['filters'],
  }
);
