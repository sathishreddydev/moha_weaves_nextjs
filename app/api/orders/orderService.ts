import {
  InsertOrder,
  InsertOrderItem,
  itemStatusHistory,
  Order,
  orderItems,
  onlineExchanges,
  onlineExchangeItems,
  orders,
  OrderWithItems,
  users
} from "@/shared";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
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
      onlineStock: variant.onlineStock ?? 0,
      isActive: variant.isActive ?? true,
    })) || [],
  };
}

// Shared helper functions to eliminate code duplication

// Reusable query builder for order selects
function buildOrderSelectQuery(dbQuery: any, additionalFields = {}) {
  return dbQuery.select({
    id: orders.id,
    userId: orders.userId,
    totalAmount: orders.totalAmount,
    discountAmount: orders.discountAmount,
    finalAmount: orders.finalAmount,
    status: orders.status,
    paymentStatus: orders.paymentStatus,
    paymentMethod: orders.paymentMethod,
    razorpayPaymentId: orders.razorpayPaymentId,
    shippingAddress: orders.shippingAddress,
    phone: orders.phone,
    email: orders.email,
    trackingNumber: orders.trackingNumber,
    estimatedDelivery: orders.estimatedDelivery,
    deliveredAt: orders.deliveredAt,
    couponId: orders.couponId,
    couponCode: orders.couponCode,
    couponType: orders.couponType,
    couponValue: orders.couponValue,
    notes: orders.notes,
    returnEligibleUntil: orders.returnEligibleUntil,
    shippingMethod: orders.shippingMethod,
    delhiveryWaybill: orders.delhiveryWaybill,
    delhiveryOrderId: orders.delhiveryOrderId,
    delhiveryStatus: orders.delhiveryStatus,
    shipmentType: orders.shipmentType,
    totalShipments: orders.totalShipments,
    completedShipments: orders.completedShipments,
    autoProcessed: orders.autoProcessed,
    addressValidated: orders.addressValidated,
    customerNotified: orders.customerNotified,
    pickupScheduled: orders.pickupScheduled,
    autoShippingAttempts: orders.autoShippingAttempts,
    lastAutoShippingAttempt: orders.lastAutoShippingAttempt,
    createdAt: orders.createdAt,
    updatedAt: orders.updatedAt,
    ...additionalFields
  });
}

// Reusable query builder for order items selects
function buildOrderItemsSelectQuery(dbQuery: any, additionalFields = {}) {
  return dbQuery.select({
    id: orderItems.id,
    orderId: orderItems.orderId,
    productId: orderItems.productId,
    variantId: orderItems.variantId,
    quantity: orderItems.quantity,
    price: orderItems.price,
    productPrice: orderItems.productPrice,
    discountedPrice: orderItems.discountedPrice,
    offerDetails: orderItems.offerDetails,
    status: orderItems.status,
    trackingNumber: orderItems.trackingNumber,
    shippedAt: orderItems.shippedAt,
    deliveredAt: orderItems.deliveredAt,
    returnEligibleUntil: orderItems.returnEligibleUntil,
    shipmentId: orderItems.shipmentId,
    delhiveryWaybill: orderItems.delhiveryWaybill,
    delhiveryPackageId: orderItems.delhiveryPackageId,
    weight: orderItems.weight,
    dimensions: orderItems.dimensions,
    createdAt: orderItems.createdAt,
    updatedAt: orderItems.updatedAt,
    ...additionalFields
  });
}

// Extract item status lookup logic — single batched query instead of N+1
async function getItemStatuses(orderItemsData: any[]) {
  if (!orderItemsData.length) return [];

  const itemIds = orderItemsData.map((item) => item.id);

  // Use a single query with DISTINCT ON to get the latest status per item
  const latestStatuses = await db
    .select({
      orderItemId: itemStatusHistory.orderItemId,
      newStatus: itemStatusHistory.newStatus,
      createdAt: itemStatusHistory.createdAt,
    })
    .from(itemStatusHistory)
    .where(inArray(itemStatusHistory.orderItemId, itemIds))
    .orderBy(itemStatusHistory.orderItemId, desc(itemStatusHistory.createdAt));

  // Deduplicate: keep only the first (latest) entry per orderItemId
  const statusMap = new Map<string, string>();
  for (const row of latestStatuses) {
    if (!statusMap.has(row.orderItemId) && row.newStatus) {
      statusMap.set(row.orderItemId, row.newStatus);
    }
  }

  return orderItemsData.map((item) => ({
    orderItemId: item.id,
    currentStatus: statusMap.get(item.id) ?? item.status,
  }));
}

// Check exchange eligibility per order item
async function checkExchangeEligibilityForItems(
  orderId: string,
  orderItemsData: any[],
  windowDays: number = 7
): Promise<{ itemId: string; eligible: boolean; reason?: string; remainingDays?: number }[]> {
  // Get already-exchanged quantities per order item (excluding cancelled)
  const activeStatuses = [
    "exchange_requested",
    "exchange_approved",
    "exchange_processing",
    "exchange_pickup_scheduled",
    "exchange_picked_up",
    "exchange_in_transit",
    "exchange_received",
    "exchange_inspected",
    "exchange_shipped",
    "exchange_delivered",
    "exchange_completed",
  ] as const;

  const exchangedRows = await db
    .select({
      orderItemId: onlineExchangeItems.orderItemId,
      qty: sql<number>`sum(${onlineExchangeItems.quantity})::int`,
    })
    .from(onlineExchangeItems)
    .innerJoin(onlineExchanges, eq(onlineExchangeItems.exchangeId, onlineExchanges.id))
    .where(
      and(
        eq(onlineExchanges.orderId, orderId),
        inArray(onlineExchanges.status, [...activeStatuses])
      )
    )
    .groupBy(onlineExchangeItems.orderItemId);

  const exchangedMap: Record<string, number> = {};
  for (const row of exchangedRows) {
    exchangedMap[row.orderItemId] = Number(row.qty || 0);
  }

  const now = new Date();

  return orderItemsData.map((item) => {
    const currentStatus = item.status;

    // Must be delivered to be exchange-eligible
    if (currentStatus !== "delivered") {
      return {
        itemId: item.id,
        eligible: false,
        reason: currentStatus.startsWith("exchange_")
          ? "Exchange already in progress"
          : currentStatus.startsWith("return_")
          ? "Return already in progress"
          : "Item must be delivered before exchange",
      };
    }

    if (!item.deliveredAt) {
      return { itemId: item.id, eligible: false, reason: "Item delivery date missing" };
    }

    const deliveredAt = new Date(item.deliveredAt);
    const eligibleUntil = new Date(deliveredAt);
    eligibleUntil.setDate(eligibleUntil.getDate() + windowDays);

    if (now > eligibleUntil) {
      return { itemId: item.id, eligible: false, reason: "Exchange window has expired" };
    }

    const purchasedQty = Number(item.quantity || 0);
    const exchangedQty = Number(exchangedMap[item.id] || 0);
    const hasRemaining = purchasedQty > exchangedQty;

    return {
      itemId: item.id,
      eligible: hasRemaining,
      reason: !hasRemaining ? "All items have already been exchanged" : undefined,
      remainingDays: hasRemaining
        ? Math.max(0, Math.floor((eligibleUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0,
    };
  });
}

// Reusable item mapping function
function mapOrderItems(
  orderItemsData: any[], 
  itemStatuses: any[], 
  productMap: Map<string, any>, 
  eligibilityMap?: any[],
  exchangeEligibilityMap?: any[]
) {
  return orderItemsData.map((item) => {
    const statusObj = itemStatuses.find((s) => s.orderItemId === item.id);
    const eligibility = eligibilityMap?.find(e => e.itemId === item.id);
    const exchangeEligibility = exchangeEligibilityMap?.find(e => e.itemId === item.id);
    const product = productMap.get(item.productId);
    
    return {
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      price: item.price,
      productPrice: item.productPrice ? item.productPrice.toString() : null,
      discountedPrice: item.discountedPrice ? item.discountedPrice.toString() : null,
      offerDetails: item.offerDetails,
      status: item.status,
      trackingNumber: item.trackingNumber,
      shippedAt: item.shippedAt,
      deliveredAt: item.deliveredAt,
      returnEligibleUntil: item.returnEligibleUntil,
      shipmentId: item.shipmentId,
      delhiveryWaybill: item.delhiveryWaybill,
      delhiveryPackageId: item.delhiveryPackageId,
      weight: item.weight,
      dimensions: item.dimensions,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      currentStatus: statusObj?.currentStatus || item.status,
      returnEligibility: eligibility || { itemId: item.id, eligible: false },
      exchangeEligibility: exchangeEligibility || { itemId: item.id, eligible: false },
      product: createOrderHistoryProduct(product) as any,
    };
  });
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

    // Get total count and paginated orders in parallel
    const [countResult, orderList] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.userId, userId)),
      db.select().from(orders).innerJoin(users, eq(orders.userId, users.id))
        .where(eq(orders.userId, userId))
        .orderBy(desc(orders.createdAt))
        .limit(pageSize)
        .offset(offset),
    ]);

    const total = countResult[0].count;
    const totalPages = Math.ceil(total / pageSize);

    if (!orderList.length) {
      return { data: [], total, page, pageSize, totalPages };
    }

    const orderIds = orderList.map(o => o.orders.id);

    // Fetch ALL order items for all orders in one query
    const allItems = await db
      .select()
      .from(orderItems)
      .where(inArray(orderItems.orderId, orderIds));

    // Get all unique product IDs across all items
    const allProductIds = [...new Set(allItems.map(item => item.productId))];

    // Get setting once
    const windowDaysSetting = await storage.getSetting("return_window_days");
    const windowDays = windowDaysSetting ? parseInt(windowDaysSetting) : 7;

    // Run all independent queries in parallel
    const [productsData, itemStatuses, returnedByOrderItem, exchangeEligibilities] = await Promise.all([
      // Fetch all products at once
      productService.getProductsByRole({ ids: allProductIds }, "user"),
      // Get item statuses for ALL items (single batched query)
      getItemStatuses(allItems),
      // Get returned quantities for all orders
      Promise.all(orderIds.map(oid => returnService.getReturnedQuantitiesByOrderItem(oid).then(map => ({ orderId: oid, map })))),
      // Get exchange eligibility for all orders
      Promise.all(orderIds.map(oid => {
        const items = allItems.filter(i => i.orderId === oid);
        return checkExchangeEligibilityForItems(oid, items, windowDays).then(result => ({ orderId: oid, result }));
      })),
    ]);

    // Create product map
    const productMap = new Map(productsData.map(product => [product.id, product]));

    // Create status map
    const statusMap = new Map(itemStatuses.map(s => [s.orderItemId, s.currentStatus]));

    // Create returned quantities map per order
    const returnedMap = new Map(returnedByOrderItem.map(r => [r.orderId, r.map]));

    // Create exchange eligibility map per order
    const exchangeEligMap = new Map(exchangeEligibilities.map(e => [e.orderId, e.result]));

    // Build result
    const now = new Date();
    const result: OrderWithItems[] = orderList.map(order => {
      const customerName = order.users.name;
      const items = allItems.filter(i => i.orderId === order.orders.id);
      const returnedByItem = returnedMap.get(order.orders.id) || {};
      const exchangeEligibility = exchangeEligMap.get(order.orders.id) || [];

      // Compute return eligibility inline
      const eligibilityMap = items.map((item) => {
        const currentStatus = statusMap.get(item.id) || item.status || "";

        if (currentStatus.startsWith("return_")) {
          return { itemId: item.id, eligible: false, reason: "Return already in progress" };
        }
        if (currentStatus.startsWith("exchange_")) {
          return { itemId: item.id, eligible: false, reason: "Exchange already in progress" };
        }
        if (currentStatus !== "delivered") {
          return { itemId: item.id, eligible: false, reason: "Item must be delivered before return" };
        }
        if (!item.deliveredAt) {
          return { itemId: item.id, eligible: false, reason: "Item delivery date missing" };
        }

        const deliveredAt = new Date(item.deliveredAt);
        const eligibleUntil = new Date(deliveredAt);
        eligibleUntil.setDate(eligibleUntil.getDate() + windowDays);

        if (now > eligibleUntil) {
          return { itemId: item.id, eligible: false, reason: "Return window has expired" };
        }

        const purchasedQty = Number(item.quantity || 0);
        const returnedQty = Number(returnedByItem[String(item.id)] || 0);
        const hasRemaining = purchasedQty > returnedQty;

        return {
          itemId: item.id,
          eligible: hasRemaining,
          reason: !hasRemaining ? "All items have already been returned or exchanged" : undefined,
          remainingDays: hasRemaining
            ? Math.max(0, Math.floor((eligibleUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
            : 0,
        };
      });

      return {
        ...order.orders,
        customerName,
        items: items.map((item) => {
          const exchangeElig = exchangeEligibility.find(e => e.itemId === item.id);
          return {
            ...item,
            currentStatus: statusMap.get(item.id) || item.status,
            returnEligibility: eligibilityMap.find(e => e.itemId === item.id) || { itemId: item.id, eligible: false },
            exchangeEligibility: exchangeElig || { itemId: item.id, eligible: false },
            product: createOrderHistoryProduct(productMap.get(item.productId)) as any,
          };
        }),
      };
    });

    return {
      data: result as OrderWithItems[],
      total,
      page,
      pageSize,
      totalPages
    };
  }

  
  async getOrder(id: string): Promise<OrderWithItems | undefined> {
    return await this.getOrderWithDetails(id, true);
  }

  async getBasicOrder(id: string): Promise<OrderWithItems | undefined> {
    return await this.getOrderWithDetails(id, false);
  }

  // Consolidated function that handles both detailed and basic order retrieval
  private async getOrderWithDetails(id: string, includeDetails: boolean): Promise<OrderWithItems | undefined> {
    // Use shared query builder for order select
    const [order] = await buildOrderSelectQuery(db)
      .from(orders)
      .where(eq(orders.id, id));
    
    if (!order) return undefined;

    // Use shared query builder for order items select
    const orderItemsData = await buildOrderItemsSelectQuery(db)
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    if (!orderItemsData.length) {
      return {
        ...order,
        items: [],
      };
    }

    // Get product IDs from order items
    const productIds = orderItemsData.map((item: any) => item.productId);

    // Run independent queries in parallel
    const windowDaysSetting = await storage.getSetting("return_window_days");
    const windowDays = windowDaysSetting ? parseInt(windowDaysSetting) : 7;

    const [productsData, itemStatuses, returnedByItem, exchangeEligibilityMap] = await Promise.all([
      // Fetch products using getProductsByRole
      productService.getProductsByRole({ ids: productIds }, "user"),
      // Get item statuses (batched single query)
      getItemStatuses(orderItemsData),
      // Get returned quantities for return eligibility (only if detailed)
      includeDetails ? returnService.getReturnedQuantitiesByOrderItem(id) : Promise.resolve({}),
      // Get exchange eligibility for all items in this order (only if detailed)
      includeDetails ? checkExchangeEligibilityForItems(order.id, orderItemsData, windowDays) : Promise.resolve(undefined),
    ]);

    // Create product map for easy lookup
    const productMap = new Map(
      productsData.map(product => [product.id, product])
    );

    // Compute return eligibility inline (avoids re-fetching the order via returnService)
    let eligibilityMap: { itemId: string; eligible: boolean; reason?: string; remainingDays?: number }[] | undefined;
    if (includeDetails) {
      const now = new Date();
      // We need currentStatus from itemStatuses for eligibility check
      const statusMap = new Map(itemStatuses.map(s => [s.orderItemId, s.currentStatus]));

      eligibilityMap = orderItemsData.map((item: any) => {
        const currentStatus = statusMap.get(item.id) || item.status || "";

        if (currentStatus.startsWith("return_")) {
          return { itemId: item.id, eligible: false, reason: "Return already in progress" };
        }
        if (currentStatus.startsWith("exchange_")) {
          return { itemId: item.id, eligible: false, reason: "Exchange already in progress" };
        }
        if (currentStatus !== "delivered") {
          return { itemId: item.id, eligible: false, reason: "Item must be delivered before return" };
        }
        if (!item.deliveredAt) {
          return { itemId: item.id, eligible: false, reason: "Item delivery date missing" };
        }

        const deliveredAt = new Date(item.deliveredAt);
        const eligibleUntil = new Date(deliveredAt);
        eligibleUntil.setDate(eligibleUntil.getDate() + windowDays);

        if (now > eligibleUntil) {
          return { itemId: item.id, eligible: false, reason: "Return window has expired" };
        }

        const purchasedQty = Number(item.quantity || 0);
        const returnedQty = Number((returnedByItem as Record<string, number>)[String(item.id)] || 0);
        const hasRemaining = purchasedQty > returnedQty;

        return {
          itemId: item.id,
          eligible: hasRemaining,
          reason: !hasRemaining ? "All items in this order have already been returned or exchanged" : undefined,
          remainingDays: hasRemaining
            ? Math.max(0, Math.floor((eligibleUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
            : 0,
        };
      });
    }

    // Get payment data (only if detailed)
    const paymentData = includeDetails && order.razorpayPaymentId 
      ? await paymentInfo({ razorpayPaymentId: order.razorpayPaymentId }) 
      : null;
    
    // Parse shipping address from JSON string if needed
    let parsedShippingAddress = order.shippingAddress;
    try {
      parsedShippingAddress = typeof order.shippingAddress === 'string' && order.shippingAddress.startsWith('{') 
        ? JSON.parse(order.shippingAddress) 
        : order.shippingAddress;
    } catch (e) {
      // If parsing fails, keep original value
      console.warn('Failed to parse shipping address:', e);
    }
    
    return {
      ...order,
      shippingAddress: parsedShippingAddress,
      paymentDetails: paymentData || undefined,
      items: mapOrderItems(orderItemsData, itemStatuses, productMap, eligibilityMap, exchangeEligibilityMap),
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
