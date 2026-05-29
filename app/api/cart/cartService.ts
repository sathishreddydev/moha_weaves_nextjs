import { db } from "@/lib/db";
import { cart, CartItemWithProduct, InsertCartItem } from "@/shared";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { productService } from "../products/productService";
import { getAvailableStock } from "@/lib/stock-utils";



export class CartRepository {

  async buildCart(userId: string): Promise<{
    cart: CartItemWithProduct[];
    count: number;
  }> {
    const rows = await db
      .select()
      .from(cart)
      .where(eq(cart.userId, userId))
      .orderBy(asc(cart.createdAt));

    const cartItems: CartItemWithProduct[] = (await Promise.all(
      rows.map(async (row) => {
        const product = await productService.getProductByRole(row.productId, "user");

        if (!product) {
          return null;
        }

        // Find variant information if variantId exists
        const variantInfo = row.variantId 
          ? product.variants?.find(v => v.id === row.variantId)
          : undefined;

        const cartItem: CartItemWithProduct = {
          id: row.id,
          createdAt: row.createdAt,
          userId: row.userId,
          productId: row.productId,
          quantity: row.quantity,
          variantId: row.variantId,
          product: {
            ...product,
            // Keep ALL variants so getAvailableStock can look up by variantId correctly.
            // If a specific variantId was requested but not found, keep the full list
            // so stock calculations don't silently fall back to product-level stock.
            variants: product.variants,
          },
        };

        return cartItem;
      })
    )).filter((item): item is CartItemWithProduct => item !== null);

    const [countRow] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${cart.quantity}), 0)`,
      })
      .from(cart)
      .where(eq(cart.userId, userId));

    return {
      cart: cartItems,
      count: countRow?.total || 0,
    };
  }

  async getCartItems(userId: string) {
    return await this.buildCart(userId);
  }

  async addToCart(item: InsertCartItem) {
    // Check if item with same productId and variantId already exists
    const existingConditions = [eq(cart.userId, item.userId), eq(cart.productId, item.productId)];
    if (item.variantId) {
      existingConditions.push(eq(cart.variantId, item.variantId));
    } else {
      // Explicitly check for NULL variantId to avoid matching rows with a different variant
      existingConditions.push(isNull(cart.variantId));
    }
    
    const [existing] = await db
      .select()
      .from(cart)
      .where(and(...existingConditions));

    // Get product with variants to check stock
    const product = await productService.getProductByRole(item.productId, "user");
    
    if (!product) {
      throw new Error("Product not found");
    }

    // Use common stock utility
    const availableStock = getAvailableStock(product, item.variantId);

    const currentQuantity = existing?.quantity || 0;
    const newQuantity = currentQuantity + (item.quantity || 1);

    // Validate stock
    if (newQuantity > availableStock) {
      throw new Error(`Only ${availableStock} items available in stock.`);
    }

    if (existing) {
      if (newQuantity <= 0) {
        await db.delete(cart).where(eq(cart.id, existing.id));
      } else {
        await db.update(cart).set({ quantity: newQuantity }).where(eq(cart.id, existing.id));
      }
    } else {
      if ((item.quantity || 1) > 0) {
        await db.insert(cart).values(item);
      }
    }

    return await this.buildCart(item.userId);
  }

  /**
   * Sets the cart item quantity to the max available stock.
   * Used during merge when adding guest qty would exceed stock.
   */
  async setToMaxStock(params: { userId: string; productId: string; variantId: string | null }) {
    const { userId, productId, variantId } = params;

    const product = await productService.getProductByRole(productId, "user");
    if (!product) return;

    const availableStock = getAvailableStock(product, variantId);
    if (availableStock <= 0) return;

    // Find existing cart item
    const existingConditions = [eq(cart.userId, userId), eq(cart.productId, productId)];
    if (variantId) {
      existingConditions.push(eq(cart.variantId, variantId));
    } else {
      existingConditions.push(isNull(cart.variantId));
    }

    const [existing] = await db
      .select()
      .from(cart)
      .where(and(...existingConditions));

    if (existing) {
      // Cap at max stock
      if (existing.quantity < availableStock) {
        await db.update(cart).set({ quantity: availableStock }).where(eq(cart.id, existing.id));
      }
    } else {
      // Insert with max stock
      await db.insert(cart).values({ userId, productId, variantId, quantity: availableStock });
    }
  }

  async updateCartItem(id: string, quantity: number, userId: string) {
    if (quantity <= 0) {
      await db.delete(cart).where(eq(cart.id, id));
      return await this.buildCart(userId);
    }

    // Get the cart item to check stock
    const [cartItem] = await db
      .select()
      .from(cart)
      .where(eq(cart.id, id));

    if (!cartItem) {
      throw new Error("Cart item not found");
    }

    // Get product with variants to check stock
    const product = await productService.getProductByRole(cartItem.productId, "user");
    
    if (!product) {
      throw new Error("Product not found");
    }

    // Use common stock utility
    const availableStock = getAvailableStock(product, cartItem.variantId);

    // Validate stock
    if (quantity > availableStock) {
      throw new Error(`Only ${availableStock} items available in stock.`);
    }

    await db.update(cart).set({ quantity }).where(eq(cart.id, id));
    return await this.buildCart(userId);
  }

  async removeFromCart(id: string, userId: string) {
    await db.delete(cart).where(eq(cart.id, id));
    return await this.buildCart(userId);
  }

  async clearCart(userId: string) {
    await db.delete(cart).where(eq(cart.userId, userId));
    return { cart: [], count: 0 };
  }
  async getCartCount(userId: string): Promise<number> {
    const [result] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${cart.quantity}), 0)`,
      })
      .from(cart)
      .where(eq(cart.userId, userId));

    return result?.total ?? 0;
  }
}

export const cartServices = new CartRepository();

