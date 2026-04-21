import { db } from "@/lib/db";
import { products, productVariants, stockMovements } from "@/shared";
import { eq, sql, and } from "drizzle-orm";
import { CartItemWithProduct } from "@/shared/types";

export class StockTransactionService {

  async validateAndDeductStock(
    cartItems: CartItemWithProduct[],
    orderRefId: string
  ): Promise<{ success: boolean; message?: string; productId?: string }> {
    return await db.transaction(async (tx) => {
      try {
        // Process each item atomically
        for (const item of cartItems) {
          const { productId, quantity, variantId } = item;

          // Get current stock with row-level locking
          let currentStock = 0;
          let stockField: any;
          let stockTable: any;

          if (variantId) {
            // Handle variant stock
            const [variant] = await tx
              .select({ onlineStock: productVariants.onlineStock })
              .from(productVariants)
              .where(eq(productVariants.id, variantId))
              .for('update'); // Row-level lock

            if (!variant) {
              throw new Error(`Variant ${variantId} not found`);
            }

            currentStock = variant.onlineStock;
            stockField = productVariants.onlineStock;
            stockTable = productVariants;
          } else {
            // Handle main product stock
            const [product] = await tx
              .select({ onlineStock: products.onlineStock })
              .from(products)
              .where(eq(products.id, productId))
              .for('update'); // Row-level lock

            if (!product) {
              throw new Error(`Product ${productId} not found`);
            }

            currentStock = product.onlineStock;
            stockField = products.onlineStock;
            stockTable = products;
          }

          // Check if sufficient stock is available
          if (currentStock < quantity) {
            throw new Error(
              `Insufficient stock for ${item.product.name}. Only ${currentStock} items available.`
            );
          }

          // Deduct stock atomically
          const [updated] = await tx
            .update(stockTable)
            .set({
              onlineStock: sql`${stockField} - ${quantity}`,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(stockTable.id, variantId || productId),
                sql`${stockField} >= ${quantity}` // Ensure stock is still sufficient
              )
            )
            .returning({ onlineStock: stockField });

          // If no rows were updated, it means stock changed between check and update
          if (!updated) {
            throw new Error(
              `Stock changed for ${item.product.name}. Please try again.`
            );
          }

          // Record stock movement
          await tx.insert(stockMovements).values({
            id: crypto.randomUUID(),
            productId,
            variantId,
            quantity: -quantity,
            movementType: "sale",
            source: "online",
            orderRefId,
            storeId: null,
            notes: `Order ${orderRefId} - Stock deduction`,
            createdAt: new Date(),
          });

          // Update total stock for main product (if not variant)
          if (!variantId) {
            await tx
              .update(products)
              .set({
                totalStock: sql`${products.totalStock} - ${quantity}`,
                updatedAt: new Date(),
              })
              .where(eq(products.id, productId));
          }
        }

        return { success: true };
      } catch (error) {
        // Transaction will be automatically rolled back
        console.error('Atomic stock operation failed:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "Stock operation failed",
          productId: this.extractProductIdFromError(error),
        };
      }
    });
  }

  /**
   * Validate stock availability without deducting (for cart operations)
   */
  async validateStockAvailability(
    cartItems: CartItemWithProduct[]
  ): Promise<{ valid: boolean; message?: string; productId?: string }> {
    try {
      for (const item of cartItems) {
        const { productId, quantity, variantId } = item;

        let currentStock = 0;
        if (variantId) {
          const [variant] = await db
            .select({ onlineStock: productVariants.onlineStock })
            .from(productVariants)
            .where(eq(productVariants.id, variantId));

          currentStock = variant?.onlineStock || 0;
        } else {
          const [product] = await db
            .select({ onlineStock: products.onlineStock })
            .from(products)
            .where(eq(products.id, productId));

          currentStock = product?.onlineStock || 0;
        }

        if (currentStock < quantity) {
          return {
            valid: false,
            message: `Insufficient stock for ${item.product.name}. Only ${currentStock} items available.`,
            productId,
          };
        }
      }

      return { valid: true };
    } catch (error) {
      console.error('Stock validation failed:', error);
      return {
        valid: false,
        message: "Failed to validate stock availability",
      };
    }
  }

  /**
   * Restore stock (for order cancellations)
   */
  async restoreStock(
    cartItems: CartItemWithProduct[],
    orderRefId: string,
    reason: string = "Order cancelled"
  ): Promise<void> {
    await db.transaction(async (tx) => {
      for (const item of cartItems) {
        const { productId, quantity, variantId } = item;

        // Restore stock atomically
        if (variantId) {
          await tx
            .update(productVariants)
            .set({
              onlineStock: sql`${productVariants.onlineStock} + ${quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(productVariants.id, variantId));
        } else {
          await tx
            .update(products)
            .set({
              onlineStock: sql`${products.onlineStock} + ${quantity}`,
              totalStock: sql`${products.totalStock} + ${quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(products.id, productId));
        }

        // Record stock movement
        await tx.insert(stockMovements).values({
          id: crypto.randomUUID(),
          productId,
          variantId,
          quantity: quantity, // Positive for restoration
          movementType: "restock",
          source: "online",
          orderRefId,
          storeId: null,
          notes: reason,
          createdAt: new Date(),
        });
      }
    });
  }

  /**
   * Extract product ID from error message for better error reporting
   */
  private extractProductIdFromError(error: any): string | undefined {
    const message = error instanceof Error ? error.message : String(error);
    const match = message.match(/Product ([a-f0-9-]+)/);
    return match ? match[1] : undefined;
  }
}

export const stockTransactionService = new StockTransactionService();
