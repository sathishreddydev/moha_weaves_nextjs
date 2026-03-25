import { db } from "@/lib/db";
import { cart, CartItemWithProduct, InsertCartItem } from "@/shared";
import { and, eq, sql } from "drizzle-orm";
import { productService } from "../products/productService";



export class CartRepository {

  async buildCart(userId: string): Promise<{
    cart: CartItemWithProduct[];
    count: number;
  }> {
    const rows = await db
      .select()
      .from(cart)
      .where(eq(cart.userId, userId));

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
            variants: variantInfo ? [variantInfo] : product.variants,
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

    let availableStock = 0;
    if (item.variantId) {
      // Get variant stock from product variants
      const variant = product.variants?.find(v => v.id === item.variantId);
      availableStock = variant?.onlineStock || 0;
    } else {
      // Calculate total stock from all variants
      availableStock = product.variants?.reduce((sum, variant) => sum + (variant.onlineStock || 0), 0) || 0;
    }

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

    let availableStock = 0;
    if (cartItem.variantId) {
      // Get variant stock from product variants
      const variant = product.variants?.find(v => v.id === cartItem.variantId);
      availableStock = variant?.onlineStock || 0;
    } else {
      // Calculate total stock from all variants
      availableStock = product.variants?.reduce((sum, variant) => sum + (variant.onlineStock || 0), 0) || 0;
    }

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

