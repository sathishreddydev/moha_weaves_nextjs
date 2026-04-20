

import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sql,
} from "drizzle-orm";

import { db } from "@/lib/db";
import { categories, colors, fabrics, productActualPrices, products, productSeo, productVariants, saleProducts, sales, storeInventory, stores, subcategories, variantStoreInventory } from "@/shared";
import { ProductWithDetails } from "@/shared/types";

export interface ProductFilters {
  search?: string;
  sku?: string;
  slug?: string;
  categories?: string[];
  subcategories?: string[];
  colors?: string[];
  fabrics?: string[];
  featured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  distributionChannel?: "shop" | "online" | "both";
  sort?: string;
  limit?: number;
  offset?: number;
  onSale?: boolean;
  ids?: string[];
  storeId?: string;
  size?: string[];
  inStock?: boolean;
  minStock?: number;
  tags?: string[];
}

export type UserRole = "user" | "admin"
export class RoleBasedProductService {

  private async getActiveSales() {
    const now = new Date();

    return db
      .select()
      .from(sales)
      .where(
        and(
          eq(sales.isActive, true),
          lte(sales.validFrom, now),
          gte(sales.validUntil, now),
        )
      );
  }

  // Helper method to fetch sale product mappings (optimized)
  private async getSaleProductMappings(saleIds?: string[]) {
    if (saleIds && saleIds.length > 0) {
      return await db
        .select()
        .from(saleProducts)
        .where(inArray(saleProducts.saleId, saleIds));
    }
    return await db.select().from(saleProducts);
  }

  // Helper method to resolve names to IDs for categories
  private async resolveCategoryNames(names: string[]) {
    if (!names.length) return [];

    const lowerNames = names.map(n => n.toLowerCase());

    let result = await db
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .where(inArray(sql`lower(${categories.name})`, lowerNames));

    if (!result.length) {
      const partialConditions = names.map(name =>
        ilike(categories.name, `%${name}%`)
      );

      result = await db
        .select({ id: categories.id, name: categories.name })
        .from(categories)
        .where(or(...partialConditions));
    }

    return result.map(c => c.id);
  }

  // Helper method to resolve names to IDs for subcategories
  private async resolveSubcategoryNames(names: string[]) {
    if (names.length === 0) return [];

    // Use case-insensitive matching with OR conditions
    const conditions = names.map(name => ilike(subcategories.name, name));

    const result = await db
      .select({ id: subcategories.id, name: subcategories.name })
      .from(subcategories)
      .where(or(...conditions));

    
    return result.map((s) => s.id);
  }

  // Helper method to resolve names to IDs for colors
  private async resolveColorNames(names: string[]) {
    if (names.length === 0) return [];

    // Use case-insensitive matching with OR conditions
    const conditions = names.map(name => ilike(colors.name, name));

    const result = await db
      .select({ id: colors.id, name: colors.name })
      .from(colors)
      .where(or(...conditions));

    
    return result.map((c) => c.id);
  }

  // Helper method to resolve names to IDs for fabrics
  private async resolveFabricNames(names: string[]) {
    if (names.length === 0) return [];

    // Use case-insensitive matching with OR conditions
    const conditions = names.map(name => ilike(fabrics.name, name));

    const result = await db
      .select({ id: fabrics.id, name: fabrics.name })
      .from(fabrics)
      .where(or(...conditions));

    console.log("Fabric lookup - Input names:", names);
    console.log("Fabric lookup - Found fabrics:", result);

    return result.map((f) => f.id);
  }

  // Helper method to find applicable sale for a product
  private findApplicableSale(
    productId: string,
    categoryId: string | null,
    activeSales: any[],
    saleProductMappings: any[],
    subcategoryId: string | null = null,
  ) {
    // Check for product-specific sale
    const productSaleMapping = saleProductMappings.find(
      (sp) => sp.productId === productId,
    );
    let applicableSale = null;
    if (productSaleMapping) {
      applicableSale = activeSales.find(
        (s) => s.id === productSaleMapping.saleId,
      );
    }

    // Check for subcategory-wide sale if no product-specific sale
    if (!applicableSale && subcategoryId) {
      applicableSale = activeSales.find(
        (s) =>
          s.subcategoryId === subcategoryId &&
          !saleProductMappings.some(
            (sp) => sp.saleId === s.id && sp.productId === productId,
          ),
      );
    }

    // Check for category-wide sale if no product-specific or subcategory sale
    if (!applicableSale && categoryId) {
      applicableSale = activeSales.find(
        (s) =>
          s.categoryId === categoryId &&
          !saleProductMappings.some(
            (sp) => sp.saleId === s.id && sp.productId === productId,
          ),
      );
    }

    return applicableSale;
  }

  // Helper method to construct active sale object
  private constructActiveSaleObject(applicableSale: any) {
    return applicableSale
      ? {
        id: applicableSale.id,
        name: applicableSale.name,
        offerType: applicableSale.offerType,
        discountValue: applicableSale.discountValue,
        maxDiscount: applicableSale.maxDiscount || undefined,
      }
      : null;
  }

  private async resolveCategoryAndSubcategoryIds(categoryIds: string[]) {
    if (categoryIds.length === 0) return [];

    const categoriesResult = await db
      .select({ id: categories.id })
      .from(categories)
      .where(inArray(categories.id, categoryIds));

    const selectedCategoryIds = categoriesResult.map((c) => c.id);

    // Get direct subcategories that were passed in IDs
    const directSubcategoriesResult = await db
      .select({ id: subcategories.id })
      .from(subcategories)
      .where(inArray(subcategories.id, categoryIds));

    const directSubcategoryIds = directSubcategoriesResult.map((s) => s.id);

    // Get subcategories under selected categories
    const expandedSubcategories =
      selectedCategoryIds.length > 0
        ? await db
          .select({ id: subcategories.id })
          .from(subcategories)
          .where(inArray(subcategories.categoryId, selectedCategoryIds))
        : [];

    return Array.from(
      new Set([
        ...directSubcategoryIds,
        ...expandedSubcategories.map((s) => s.id),
      ]),
    );
  }

  private async getSaleMappings(saleIds: string[]) {
    if (!saleIds.length) return [];

    return db
      .select()
      .from(saleProducts)
      .where(inArray(saleProducts.saleId, saleIds));
  }

  private calculateDiscountedPrice(price: number, sale: any) {
    if (!sale) return undefined;

    let discounted = price;

    if (
      sale.offerType === "percentage" ||
      sale.offerType === "category" ||
      sale.offerType === "flash_sale"
    ) {
      const percent = Number(sale.discountValue);
      const discount = price * (percent / 100);
      const maxDiscount = sale.maxDiscount
        ? Number(sale.maxDiscount)
        : price;

      discounted = price - Math.min(discount, maxDiscount);
    }

    if (sale.offerType === "flat" || sale.offerType === "product") {
      const flat = Number(sale.discountValue);
      discounted = price - Math.min(flat, price);
    }

    return Math.max(0, discounted);
  }


  private async getVariantsForProducts(productIds: string[], userRole: UserRole = "user") {
    if (!productIds.length) return new Map();

    const rows = await db
      .select({
        variant: productVariants,
        storeId: variantStoreInventory.storeId,
        quantity: variantStoreInventory.quantity,
        storeName: stores.name,
      })
      .from(productVariants)
      .leftJoin(
        variantStoreInventory,
        eq(productVariants.id, variantStoreInventory.variantId)
      )
      .leftJoin(stores, eq(variantStoreInventory.storeId, stores.id))
      .where(
        and(
          inArray(productVariants.productId, productIds),
          eq(productVariants.isActive, true)
        )
      )
      .orderBy(asc(productVariants.size));

    const productVariantMap = new Map<string, any[]>();

    for (const row of rows) {
      const productId = row.variant.productId;

      if (!productVariantMap.has(productId)) {
        productVariantMap.set(productId, []);
      }

      const variants = productVariantMap.get(productId)!;

      let existing = variants.find(v => v.id === row.variant.id);

      if (!existing) {
        existing = {
          ...row.variant,
          storeAllocations: userRole === "user" ? undefined : [],
        };



        variants.push(existing);
      }

      if (row.storeId && userRole !== "user") {
        existing.storeAllocations.push({
          storeId: row.storeId,
          storeName: row.storeName ?? "Unknown",
          quantity: row.quantity,
        });
      }
    }

    return productVariantMap;
  }


  async getProductsByRole(
    filters: ProductFilters = {},
    role: UserRole = "user",
  ): Promise<ProductWithDetails[]> {
    try {
      const conditions: any[] = [eq(products.isActive, true)];

      if (filters.ids?.length)
        conditions.push(inArray(products.id, filters.ids));

      if (filters.sku)
        conditions.push(eq(products.sku, filters.sku));

      if (filters.slug) {
        conditions.push(eq(productSeo.urlSlug, filters.slug));
      }

      if (filters.search) {
        conditions.push(
          or(
            ilike(products.name, `%${filters.search}%`),
            ilike(products.description, `%${filters.search}%`),
            ilike(products.sku, `%${filters.search}%`)
          )
        );
      }
      // Resolve names to IDs
      const categoryIds = filters.categories?.length ? await this.resolveCategoryNames(filters.categories) : [];
      const subcategoryIds = filters.subcategories?.length ? await this.resolveSubcategoryNames(filters.subcategories) : [];
      const colorIds = filters.colors?.length ? await this.resolveColorNames(filters.colors) : [];
      const fabricIds = filters.fabrics?.length ? await this.resolveFabricNames(filters.fabrics) : [];

      // Get subcategories from categories only if no specific subcategories are selected
      const categorySubcategoryIds = (categoryIds.length > 0 && subcategoryIds.length === 0) 
        ? await this.resolveCategoryAndSubcategoryIds(categoryIds) 
        : [];

      // Use specific subcategories if provided, otherwise use category subcategories
      const allSubcategoryIds = subcategoryIds.length > 0 
        ? subcategoryIds 
        : categorySubcategoryIds;

      
      if (allSubcategoryIds.length) {
        conditions.push(inArray(products.subcategoryId, allSubcategoryIds));
      }

      if (colorIds.length) {
        conditions.push(inArray(products.colorId, colorIds));
      }

      if (fabricIds.length) {
        conditions.push(inArray(products.fabricId, fabricIds));
      }
      if (filters.featured)
        conditions.push(eq(products.isFeatured, true));

      if (filters.distributionChannel === "online") {
        conditions.push(
          or(
            eq(products.distributionChannel, "online"),
            eq(products.distributionChannel, "both")
          )
        );
      }

      if (filters.distributionChannel === "shop") {
        conditions.push(
          or(
            eq(products.distributionChannel, "shop"),
            eq(products.distributionChannel, "both")
          )
        );
      }

      let orderBy: any = desc(products.createdAt);

      if (filters.sort === "price-low") orderBy = asc(products.price);
      if (filters.sort === "price-high") orderBy = desc(products.price);
      if (filters.sort === "name") orderBy = asc(products.name);

      const rows = await db
        .select({
          product: products,
          category: categories,
          subcategory: subcategories,
          color: colors,
          fabric: fabrics,
          seo: productSeo,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(subcategories, eq(products.subcategoryId, subcategories.id))
        .leftJoin(colors, eq(products.colorId, colors.id))
        .leftJoin(fabrics, eq(products.fabricId, fabrics.id))
        .leftJoin(
          productSeo,
          eq(products.id, productSeo.productId)
        )
        .where(and(...conditions))
        .orderBy(orderBy)
        .limit(filters.limit ?? 100)
        .offset(filters.offset ?? 0);

      const productMap = new Map<string, any>();

      for (const row of rows) {
        if (!productMap.has(row.product.id)) {
          productMap.set(row.product.id, {
            ...row.product,
            category: row.category,
            subcategory: row.subcategory,
            color: row.color,
            fabric: row.fabric,
            seoTitle: row.seo?.seoTitle || null,
            seoDescription: row.seo?.seoDescription || null,
            seoKeywords: row.seo?.seoKeywords || null,
            metaTags: row.seo?.metaTags || null,
            urlSlug: row.seo?.urlSlug || null,
          });
        }
      }

      let results = Array.from(productMap.values());
      if (!results.length) return [];

      const activeSales = await this.getActiveSales();
      const saleMappings = await this.getSaleMappings(
        activeSales.map(s => s.id)
      );

      const productSaleMap = new Map<string, any>();

      for (const mapping of saleMappings) {
        productSaleMap.set(mapping.productId, mapping.saleId);
      }

      const variantMap = await this.getVariantsForProducts(
        results.map(p => p.id), role
      );


      results = results.map(product => {
        const basePrice = Number(product.price);

        // Use proper sale finding logic with priority handling
        const applicableSale = this.findApplicableSale(
          product.id,
          product.categoryId,
          activeSales,
          saleMappings,
          product.subcategoryId
        );

        const sale = this.constructActiveSaleObject(applicableSale);

        const discountedPrice = sale
          ? this.calculateDiscountedPrice(basePrice, sale)
          : undefined;

        return {
          ...product,
          variants: variantMap.get(product.id) ?? [],
          storeAllocations: undefined,
          activeSale: sale ?? null,
          discountedPrice,
        };
      });

      if (filters.minPrice !== undefined) {
        results = results.filter(p =>
          (p.discountedPrice ?? Number(p.price)) >= filters.minPrice!
        );
      }

      if (filters.maxPrice !== undefined) {
        results = results.filter(p =>
          (p.discountedPrice ?? Number(p.price)) <= filters.maxPrice!
        );
      }

      if (filters.onSale) {
        results = results.filter(p => p.activeSale !== null);
      }

      if (filters.storeId) {
        results = results.filter(p => {
          const hasStoreAllocation = p.storeAllocations?.some(
            (allocation: { storeId: string; storeName: string; quantity: number }) => allocation.storeId === filters.storeId
          );
          const hasVariantInStore = p.variants?.some((variant: any) =>
            variant.storeAllocations?.some(
              (storeAllocation: { storeId: string; storeName: string; quantity: number }) => storeAllocation.storeId === filters.storeId
            )
          );
          return hasStoreAllocation || hasVariantInStore;
        });
      }

      if (filters.size?.length) {
        results = results.filter(p =>
          p.variants?.some((variant: any) =>
            filters.size!.includes(variant.size)
          )
        );
      }

      if (filters.inStock) {
        results = results.filter(p => {
          const totalStock = p.variants?.reduce((sum: number, variant: any) =>
            sum + (variant.onlineStock || 0) +
            variant.storeAllocations?.reduce((storeSum: number, allocation: { quantity: number }) =>
              storeSum + (allocation.quantity || 0), 0) || 0, 0) || 0;
          return totalStock > 0;
        });
      }

      if (filters.minStock !== undefined) {
        results = results.filter(p => {
          const totalStock = p.variants?.reduce((sum: number, variant: any) =>
            sum + (variant.onlineStock || 0) +
            variant.storeAllocations?.reduce((storeSum: number, allocation: { quantity: number }) =>
              storeSum + (allocation.quantity || 0), 0) || 0, 0) || 0;
          return totalStock >= filters.minStock!;
        });
      }

      return results;
    } catch (error) {
      console.error('Error fetching products by role:', error);
      return [];
    }
  }

  async getProductByRole(id: string, role: UserRole = "user") {
    const products = await this.getProductsByRole(
      { ids: [id], limit: 1 },
      role
    );
    return products[0];
  }

  async getProductBySkuByRole(sku: string, role: UserRole = "user") {
    const products = await this.getProductsByRole(
      { sku, limit: 1 },
      role
    );
    return products[0];
  }

  async getProductBySlug(slug: string) {
    const products = await this.getProductsByRole(
      { slug, limit: 1 },
      "user"
    );
    return products[0];
  }




}


export const productService = new RoleBasedProductService();
