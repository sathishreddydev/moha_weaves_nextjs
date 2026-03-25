import { db } from "@/lib/db";
import { products, users, notifications, appSettings, User, itemStatusHistory } from "@/shared";
import { eq, and, gte } from "drizzle-orm";

export class DatabaseStorage {
    async getUser(id: string): Promise<User | undefined> {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user || undefined;
    }

    async itemHistory(
        orderItemId: string,
        currentStatus: string,
        newStatus: string,
        note: string,
        updatedBy?: string,
    ): Promise<void> {
        await db.insert(itemStatusHistory).values({
            orderItemId,
            status: currentStatus,
            newStatus,
            note,
            updatedBy,
            createdAt: new Date(),
        });
    }

    async getSetting(key: string): Promise<string | null> {
        const [result] = await db
            .select()
            .from(appSettings)
            .where(eq(appSettings.key, key));
        return result?.value ?? null;
    }

    async createNotification(
        notification: Omit<typeof notifications.$inferInsert, 'id' | 'createdAt'>,
    ) {
        const [result] = await db
            .insert(notifications)
            .values(notification)
            .returning();
        return result;
    }

    async checkAndCreateStockAlert(productId: string): Promise<void> {
        const [product] = await db
            .select()
            .from(products)
            .where(eq(products.id, productId));
        if (!product) return;
        
        // Get threshold from settings, default to 10
        const thresholdSetting = await this.getSetting("low_stock_threshold");
        const threshold = thresholdSetting ? parseInt(thresholdSetting) : 10;
        
        // Alert if total stock is at or below threshold
        if (product.totalStock <= threshold) {
            // Get all inventory role users to notify
            const inventoryUsers = await db
                .select()
                .from(users)
                .where(eq(users.role, "inventory"));

            for (const user of inventoryUsers) {
                // Check if alert already exists in last 24 hours
                const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                const [existingAlert] = await db
                    .select()
                    .from(notifications)
                    .where(
                        and(
                            eq(notifications.userId, user.id),
                            eq(notifications.type, "system"),
                            eq(notifications.relatedId, productId),
                            gte(notifications.createdAt, dayAgo),
                        ),
                    );

                if (!existingAlert) {
                    await this.createNotification({
                        userId: user.id,
                        type: "system",
                        title: "Low Stock Alert",
                        message: `${product.name} is running low on stock (${product.totalStock} remaining). Please restock soon.`,
                        relatedId: productId,
                        relatedType: "product",
                        isRead: false,
                    });
                }
            }
        }
    }
}

export const storage = new DatabaseStorage();