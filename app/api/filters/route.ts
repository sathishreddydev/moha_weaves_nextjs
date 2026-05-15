import { db } from '@/lib/db';
import { categories, Category, Color, colors, Fabric, fabrics, subcategories, Subcategory } from '@/shared';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

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
    subcategories: allSubcategories.filter(sub => sub.categoryId === category.id)
  }));
}

async function getColors(): Promise<Color[]> {
  return db.select().from(colors).where(eq(colors.isActive, true));
}

async function getFabrics(): Promise<Fabric[]> {
  return db.select().from(fabrics).where(eq(fabrics.isActive, true));
}

