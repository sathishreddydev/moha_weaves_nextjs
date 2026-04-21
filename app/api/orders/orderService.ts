import {
  categories,
  colors,
  fabrics,
  InsertOrder,
  InsertOrderItem,
  itemStatusHistory,
  Order,
  orderItems,
  orders,
  OrderWithItems,
  products,
  productVariants,
  stockMovements,
  users
} from "@/shared";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { IdGenerator } from "@/lib/idGenerator";
import { paymentInfo } from "./createOrderService";
import { storage } from "./storage";
import { returnService } from "./returnService/returnService";
import { productService } from "../products/productService";

// Utility function to extract only required product data for order history
function createOrderHistoryProduct(product: any) {
  if (!product) {
    return {
      id: '',
      name: 'Unknown Product',
      imageUrl: null,
      category: null,
      color: null,
      variants: [],
    };
  }

  return {
    id: product.id,
    name: product.name,
    imageUrl: product.imageUrl,
    category: product.category ? {
      id: product.category.id,
      name: product.category.name,
    } : null,
    color: product.color ? {
      id: product.color.id,
      name: product.color.name,
    } : null,
    variants: product.variants?.map((variant: any) => ({
      id: variant.id,
      size: variant.size,
    })) || [],
  };
}

export interface OrderStorage {
  createOrder(
    order: InsertOrder,
    items: Omit<InsertOrderItem, "orderId">[]
  ): Promise<Order>;
  getOrders(userId: string, page?: number, pageSize?: number): Promise<{
    data: OrderWithItems[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>;
  getOrder(id: string): Promise<OrderWithItems | undefined>;
  getBasicOrder(id: string): Promise<OrderWithItems | undefined>;
  updateItemStatus(
    orderItemId: string,
    status: string,
    updatedBy?: string,
    note?: string
  ): Promise<any | undefined>;
  updateOrderStatus(
    orderId: string,
    status: string,
    updatedBy?: string,
    note?: string
  ): Promise<any | undefined>;
}

export class OrderRepository implements OrderStorage {
  async createOrder(
    order: InsertOrder,
    items: Omit<InsertOrderItem, "orderId">[]
  ): Promise<Order> {
    return await db.transaction(async (trx) => {
      return await this.createOrderWithTransaction(trx, order, items);
    });
  }

  async createOrderWithTransaction(
    trx: any,
    order: InsertOrder,
    items: Omit<InsertOrderItem, "orderId">[]
  ): Promise<Order> {
    // Generate order ID
    const orderId = await IdGenerator.generateOrderId();

    const [newOrder] = await trx.insert(orders).values({
      ...order,
      id: orderId,
    }).returning();

    let itemIndex = 1;
    for (const item of items) {
      const itemId = IdGenerator.generateItemIdFromOrder(orderId, itemIndex - 1);

      const [newOrderItem] = await trx.insert(orderItems).values({
        ...item,
        id: itemId,
        orderId: newOrder.id,
        status: "pending"
      }).returning();

      // Create initial item status history
      await storage.itemHistoryWithTransaction(
        trx,
        newOrderItem.id,
        "pending",
        "pending",
        "Order created"
      );
      itemIndex++;
    }

    return newOrder;
  }
  async getOrders(
    userId: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<{
    data: OrderWithItems[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    // Calculate offset
    const offset = (page - 1) * pageSize;

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.userId, userId));

    const total = countResult.count;
    const totalPages = Math.ceil(total / pageSize);

    // Get paginated orders
    const orderList = await db
      .select()
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt))
      .limit(pageSize)
      .offset(offset);

    const result: OrderWithItems[] = [];

    for (const order of orderList) {
      const customerName = order.users.name;

      // Get order items first
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.orders.id));

      // Get product IDs from order items
      const productIds = items.map(item => item.productId);

      // Fetch products using getProductsByRole
      const productsData = await productService.getProductsByRole(
        { ids: productIds },
        "user"
      );

      // Create product map for easy lookup
      const productMap = new Map(
        productsData.map(product => [product.id, product])
      );

      // Get return eligibility for all items in this order
      const eligibilityMap = await returnService.checkOrderReturnEligibility(order.orders.id);

      result.push({
        ...order.orders,
        customerName,
        items: items.map((item) => {
          const product = productMap.get(item.productId);
          return {
            ...item,
            returnEligibility: eligibilityMap.find(e => e.itemId === item.id) || { itemId: item.id, eligible: false },
            product: createOrderHistoryProduct(product) as any,
          };
        }),
      });
    }

    return {
      data: result as OrderWithItems[],
      total,
      page,
      pageSize,
      totalPages
    };
  }

  async getBasicOrder(id: string): Promise<OrderWithItems | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;

    // Get order items first
    const orderItemsData = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    if (!orderItemsData.length) {
      return {
        ...order,
        items: [],
      };
    }

    // Get product IDs from order items
    const productIds = orderItemsData.map(item => item.productId);

    // Fetch products using getProductsByRole
    const productsData = await productService.getProductsByRole(
      { ids: productIds },
      "user"
    );

    // Create product map for easy lookup
    const productMap = new Map(
      productsData.map(product => [product.id, product])
    );

    const itemStatuses = await Promise.all(
      orderItemsData.map(async (item) => {
        const [latestStatus] = await db
          .select({ newStatus: itemStatusHistory.newStatus })
          .from(itemStatusHistory)
          .where(eq(itemStatusHistory.orderItemId, item.id))
          .orderBy(desc(itemStatusHistory.createdAt))
          .limit(1);

        return {
          orderItemId: item.id,
          currentStatus: latestStatus?.newStatus ?? item.status,
        };
      })
    );
    return {
      ...order,
      items: orderItemsData.map((item) => {
        const statusObj = itemStatuses.find((s) => s.orderItemId === item.id);
        const product = productMap.get(item.productId);
        return {
          ...item,
          status: item.status,
          currentStatus: statusObj?.currentStatus || item.status,
          product: createOrderHistoryProduct(product) as any,
        };
      }),
    };
  }

  async getOrder(id: string): Promise<OrderWithItems | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;

    // Get order items first
    const orderItemsData = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    if (!orderItemsData.length) {
      return {
        ...order,
        items: [],
      };
    }

    // Get product IDs from order items
    const productIds = orderItemsData.map(item => item.productId);

    // Fetch products using getProductsByRole
    const productsData = await productService.getProductsByRole(
      { ids: productIds },
      "user"
    );

    // Create product map for easy lookup
    const productMap = new Map(
      productsData.map(product => [product.id, product])
    );

    // Get return eligibility for all items in this order
    const eligibilityMap = await returnService.checkOrderReturnEligibility(order.id);

    const itemStatuses = await Promise.all(
      orderItemsData.map(async (item) => {
        const [latestStatus] = await db
          .select({ newStatus: itemStatusHistory.newStatus })
          .from(itemStatusHistory)
          .where(eq(itemStatusHistory.orderItemId, item.id))
          .orderBy(desc(itemStatusHistory.createdAt))
          .limit(1);

        return {
          orderItemId: item.id,
          currentStatus: latestStatus?.newStatus ?? item.status,
        };
      })
    );
    const paymentData = order.razorpayPaymentId ? await paymentInfo({ razorpayPaymentId: order.razorpayPaymentId }) : null;
    return {
      ...order,
      paymentDetails: paymentData || undefined,
      items: orderItemsData.map((item) => {
        const statusObj = itemStatuses.find((s) => s.orderItemId === item.id);
        const eligibility = eligibilityMap.find(e => e.itemId === item.id);
        const product = productMap.get(item.productId);
        return {
          ...item,
          status: item.status,
          currentStatus: statusObj?.currentStatus || item.status,
          returnEligibility: eligibility || { itemId: item.id, eligible: false },
          product: createOrderHistoryProduct(product) as any,
        };
      }),
    };
  }

  async updateItemStatus(
    orderItemId: string,
    status: string,
    updatedBy?: string,
    note?: string
  ): Promise<any | undefined> {
    return await db.transaction(async (tx) => {
      // Get current item status
      const [currentItem] = await tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.id, orderItemId));

      if (!currentItem) return undefined;

      // Update item status
      const [updatedItem] = await tx
        .update(orderItems)
        .set({
          status: status as any,
          updatedAt: new Date(),
          ...(status === "shipped" && { shippedAt: new Date() }),
          ...(status === "delivered" && { deliveredAt: new Date() }),
        })
        .where(eq(orderItems.id, orderItemId))
        .returning();

      // Create status history record
      await storage.itemHistory(
        orderItemId,
        currentItem.status,
        status,
        note || `Status updated to ${status}`,
        updatedBy
      );

      // Create notification for user if this is a significant status change
      let notificationMessage = "";
      switch (status) {
        case "confirmed":
          notificationMessage = "An item in your order has been confirmed and is being processed.";
          break;
        case "processing":
          notificationMessage = "An item in your order is being prepared for shipment.";
          break;
        case "shipped":
          notificationMessage = "An item in your order has been shipped!";
          break;
        case "delivered":
          notificationMessage = "An item in your order has been delivered.";
          break;
        case "cancelled":
          notificationMessage = "An item in your order has been cancelled.";
          break;
      }

      if (notificationMessage) {
        // Get order to find userId for notification
        const [order] = await tx
          .select()
          .from(orders)
          .where(eq(orders.id, currentItem.orderId));

        if (order) {
          await storage.createNotification({
            userId: order.userId,
            type: "order",
            title: `Item ${status.charAt(0).toUpperCase() + status.slice(1)}`,
            message: notificationMessage,
            relatedId: currentItem.orderId,
            relatedType: "order",
            isRead: false,
          });
        }
      }

      return updatedItem;
    });
  }

  async updateOrderStatus(
    orderId: string,
    status: string,
  ): Promise<any | undefined> {
    return await db.transaction(async (tx) => {
      // Get current order status
      const [currentOrder] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));

      if (!currentOrder) return undefined;

      // Update order status
      const [updatedOrder] = await tx
        .update(orders)
        .set({
          status: status as any,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId))
        .returning();

      return updatedOrder;
    });
  }
}

export const orderService = new OrderRepository();
