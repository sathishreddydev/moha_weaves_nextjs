import { db } from "@/lib/db";
import { wishlist } from "@/shared";
import { InsertWishlistItem, WishlistItemWithProduct } from "@/shared";
import { and, eq, sql } from "drizzle-orm";
import { productService, RoleBasedProductService } from "../products/productService";




export class WishlistRepository {
  async buildWishlist(userId: string): Promise<{
    wishlist: WishlistItemWithProduct[];
    count: number;
  }> {
    try {
      const rows = await db
        .select()
        .from(wishlist)
        .where(eq(wishlist.userId, userId));

      const wishlistItems: WishlistItemWithProduct[] = (await Promise.all(
        rows.map(async (row) => {
          try {
            const product = await productService.getProductByRole(row.productId, "user");

            if (!product) {
              return null;
            }

            return {
              id: row.id,
              createdAt: row.createdAt,
              userId: row.userId,
              productId: row.productId,
              product,
            };
          } catch (productError) {
            return null;
          }
        })
      )).filter((item): item is WishlistItemWithProduct => item !== null);

      return {
        wishlist: wishlistItems,
        count: wishlistItems.length,
      };
    } catch (error) {
      return {
        wishlist: [],
        count: 0,
      };
    }
  }

  async getWishlistItems(userId: string) {
    return await this.buildWishlist(userId);
  }

  async addToWishlist(item: InsertWishlistItem) {
    try {
      const [existing] = await db
        .select()
        .from(wishlist)
        .where(
          and(
            eq(wishlist.userId, item.userId),
            eq(wishlist.productId, item.productId)
          )
        );

      if (!existing) {
        await db.insert(wishlist).values(item);
      }

      return await this.buildWishlist(item.userId);
    } catch (error) {
      throw new Error('Failed to add item to wishlist');
    }
  }

  async removeFromWishlist(userId: string, productId: string) {
    try {
      await db
        .delete(wishlist)
        .where(and(eq(wishlist.userId, userId), eq(wishlist.productId, productId)));

      return await this.buildWishlist(userId);
    } catch (error) {
      throw new Error('Failed to remove item from wishlist');
    }
  }

  async isInWishlist(userId: string, productId: string) {
    try {
      const [result] = await db
        .select()
        .from(wishlist)
        .where(and(eq(wishlist.userId, userId), eq(wishlist.productId, productId)));

      return !!result;
    } catch (error) {
      return false;
    }
  }
  async getWishlistCount(userId: string): Promise<number> {
    try {
      const [result] = await db
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(wishlist)
        .where(eq(wishlist.userId, userId));

      return result?.count ?? 0;
    } catch (error) {
      return 0;
    }
  }
}

export const wishlistServices = new WishlistRepository();
