import { z } from "zod";
import * as tables from "./tables";

// Insert schemas
export const insertUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  role: z.enum(["user", "admin", "store_manager"]).default("user"),
  storeId: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const insertRefreshTokenSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  token: z.string().min(1, "Token is required"),
  expiresAt: z.date(),
  isRevoked: z.boolean().default(false),
});

export const insertCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  sizes: z.array(z.string()).default([]),
});

export const insertSubcategorySchema = z.object({
  name: z.string().min(1, "Subcategory name is required"),
  categoryId: z.string().min(1, "Category ID is required"),
});

export const insertColorSchema = z.object({
  name: z.string().min(1, "Color name is required"),
  code: z.string().optional(),
});

export const insertFabricSchema = z.object({
  name: z.string().min(1, "Fabric name is required"),
  description: z.string().optional(),
});

export const insertStoreSchema = z.object({
  name: z.string().min(1, "Store name is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const insertProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  code: z.string().optional(),
  categoryId: z.string().optional(),
  subcategoryId: z.string().optional(),
  colorId: z.string().optional(),
  fabricId: z.string().optional(),
  price: z.string().optional(),
  costPrice: z.string().optional(),
  images: z.array(z.string()).optional(),
  videoUrl: z.string().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

export const insertStoreInventorySchema = z.object({
  storeId: z.string().min(1, "Store ID is required"),
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().min(0, "Quantity must be non-negative").default(0),
});

export const insertWishlistSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  productId: z.string().min(1, "Product ID is required"),
});

export const insertCartSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  variantId: z.string().optional(),
});

export const insertStoreCartSchema = z.object({
  storeId: z.string().min(1, "Store ID is required"),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  items: z.array(z.any()).optional(),
  totalAmount: z.string().optional(),
});

export const insertOrderSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  totalAmount: z.string().min(1, "Total amount is required"),
  discountAmount: z.string().default("0"),
  finalAmount: z.string().min(1, "Final amount is required"),
  status: z.enum(["created", "processing", "completed", "cancelled"]).default("created"),
  shippingAddress: z.string().min(1, "Shipping address is required"),
  billingAddress: z.string().optional(),
  paymentMethod: z.enum(["razorpay"]).optional(),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).default("pending"),
  phone: z.string().min(1, "Phone number is required"),
  couponId: z.string().optional(),
  notes: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
});

export const insertOrderItemSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  price: z.string().min(1, "Price is required"),
  variantId: z.string().optional(),
});

export const insertStoreSaleSchema = z.object({
  storeId: z.string().min(1, "Store ID is required"),
  totalAmount: z.string().min(1, "Total amount is required"),
  paymentMode: z.string().min(1, "Payment mode is required"),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
});

export const insertStoreSaleItemSchema = z.object({
  storeSaleId: z.string().min(1, "Store sale ID is required"),
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  price: z.string().min(1, "Price is required"),
  variantId: z.string().optional(),
});

export const insertStockRequestSchema = z.object({
  storeId: z.string().min(1, "Store ID is required"),
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  status: z.enum(["pending", "approved", "rejected", "completed"]).default("pending"),
  requestedBy: z.string().min(1, "Requested by is required"),
});

export const insertUserAddressSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  locality: z.string().min(1, "Locality is required"),
  city: z.string().min(1, "City is required"),
  pincode: z.string().min(1, "Pincode is required"),
  addressType: z.enum(["home", "work", "other"]).default("home"),
  isDefault: z.boolean().default(false),
});

export const insertServiceablePincodeSchema = z.object({
  pincode: z.string().min(1, "Pincode is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const insertReturnRequestSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  userId: z.string().min(1, "User ID is required"),
  status: z.enum(["return_requested", "return_approved", "return_rejected", "return_pickup_scheduled", "return_picked_up", "return_received", "return_inspected", "return_completed"]).default("return_requested"),
  reason: z.enum(["defective", "wrong_item", "not_as_described", "size_issue", "color_mismatch", "damaged_in_shipping", "changed_mind", "quality_issue", "other"]),
  reasonDetails: z.string().optional(),
  resolution: z.enum(["refund", "exchange", "store_credit"]).default("refund"),
  refundAmount: z.string().optional(),
  pickupAddress: z.string().optional(),
  pickupScheduledAt: z.date().optional(),
  pickedUpAt: z.date().optional(),
  receivedAt: z.date().optional(),
  inspectionNotes: z.string().optional(),
  processedBy: z.string().optional(),
  exchangeOrderId: z.string().optional(),
});

export const insertReturnItemSchema = z.object({
  returnRequestId: z.string().min(1, "Return request ID is required"),
  orderItemId: z.string().min(1, "Order item ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  reason: z.string().optional(),
});

export const insertOnlineExchangeSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  userId: z.string().min(1, "User ID is required"),
  reason: z.string().min(1, "Reason is required"),
  status: z.enum(["pending", "approved", "rejected", "completed"]).default("pending"),
  notes: z.string().optional(),
});

export const insertOnlineExchangeItemSchema = z.object({
  exchangeRequestId: z.string().min(1, "Exchange request ID is required"),
  orderItemId: z.string().min(1, "Order item ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  reason: z.string().optional(),
});

export const insertRefundSchema = z.object({
  returnRequestId: z.string().optional(),
  orderId: z.string().min(1, "Order ID is required"),
  userId: z.string().min(1, "User ID is required"),
  amount: z.string().min(1, "Amount is required"),
  status: z.enum(["pending", "processing", "completed", "failed"]).default("pending"),
  paymentId: z.string().optional(),
  notes: z.string().optional(),
});

export const insertProductReviewSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  userId: z.string().min(1, "User ID is required"),
  orderId: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  isVerified: z.boolean().default(false),
});

export const insertCouponSchema = z.object({
  name: z.string().min(1, "Coupon name is required"),
  code: z.string().min(1, "Coupon code is required"),
  description: z.string().optional(),
  type: z.enum(["percentage", "fixed", "free_shipping"]).default("percentage"),
  value: z.string().min(1, "Coupon value is required"),
  minOrderValue: z.string().optional(),
  maxDiscount: z.string().optional(),
  usageLimit: z.number().int().optional(),
  usageCount: z.number().int().default(0),
  isActive: z.boolean().default(true),
  validFrom: z.date().or(z.string()),
  validUntil: z.date().or(z.string()),
});

export const insertCouponUsageSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  orderId: z.string().min(1, "Order ID is required"),
  couponId: z.string().min(1, "Coupon ID is required"),
  discountAmount: z.string().min(1, "Discount amount is required"),
});

export const insertNotificationSchema = z.object({
  message: z.string().min(1, "Message is required"),
  type: z.enum(["order", "return", "refund", "promotion", "system"]).default("system"),
  title: z.string().min(1, "Title is required"),
  userId: z.string().min(1, "User ID is required"),
  data: z.string().optional(),
  isRead: z.boolean().default(false),
  relatedId: z.string().optional(),
  relatedType: z.string().optional(),
  readAt: z.date().optional(),
});

export const insertAppSettingSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string().min(1, "Value is required"),
  description: z.string().optional(),
  updatedBy: z.string().optional(),
});

export const insertItemStatusHistorySchema = z.object({
  status: z.string().min(1, "Status is required"),
  orderItemId: z.string().min(1, "Order item ID is required"),
  updatedBy: z.string().optional(),
  newStatus: z.string().optional(),
  note: z.string().optional(),
});

export const insertStockMovementSchema = z.object({
  storeId: z.string().optional(),
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int(),
  variantId: z.string().optional(),
  notes: z.string().optional(),
  movementType: z.enum(["in", "out", "transfer", "adjustment", "damage", "return"]).default("in"),
  source: z.enum(["online", "store", "warehouse", "supplier"]).default("store"),
  orderRefId: z.string().min(1, "Order reference ID is required"),
  createdBy: z.string().min(1, "Created by is required"),
});

export const insertStockTransferSchema = z.object({
  fromStoreId: z.string().optional(),
  toStoreId: z.string().min(1, "Destination store ID is required"),
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  status: z.enum(["pending", "in_transit", "received", "cancelled", "approved", "rejected"]).default("pending"),
  transferredBy: z.string().min(1, "Transferred by is required"),
});

export const insertInventoryAdjustmentSchema = z.object({
  storeId: z.string().optional(),
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int(),
  reason: z.string().min(1, "Reason is required"),
  adjustedBy: z.string().min(1, "Adjusted by is required"),
  notes: z.string().optional(),
});

export const insertStoreExchangeSchema = z.object({
  storeId: z.string().min(1, "Store ID is required"),
  originalSaleId: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  status: z.enum(["pending", "completed", "cancelled"]).default("pending"),
  processedBy: z.string().optional(),
  balanceDirection: z.enum(["pay_to_customer", "receive_from_customer"]).optional(),
  balanceAmount: z.string().optional(),
});

export const insertStoreExchangeReturnItemSchema = z.object({
  exchangeId: z.string().min(1, "Exchange ID is required"),
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  variantId: z.string().optional(),
  unitPrice: z.string().min(1, "Unit price is required"),
  returnReason: z.string().optional(),
  damageImages: z.array(z.string()).optional(),
});

export const insertStoreExchangeNewItemSchema = z.object({
  exchangeId: z.string().min(1, "Exchange ID is required"),
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  variantId: z.string().optional(),
  unitPrice: z.string().min(1, "Unit price is required"),
});

export const insertSaleSchema = z.object({
  name: z.string().min(1, "Sale name is required"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  categoryId: z.string().optional(),
  subcategoryId: z.string().optional(),
  offerType: z.enum(["percentage", "fixed"]).default("percentage"),
  discountValue: z.string().min(1, "Discount value is required"),
  maxDiscount: z.string().optional(),
  minOrderValue: z.string().optional(),
  validFrom: z.date().or(z.string()),
  validUntil: z.date().or(z.string()),
  bannerImage: z.string().optional(),
});

export const insertSaleProductSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  saleId: z.string().min(1, "Sale ID is required"),
});

export const insertContactMessageSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export const insertProductDamageSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  storeId: z.string().optional(),
  variantId: z.string().optional(),
  quantity: z.number().int().optional(),
  reason: z.string().min(5, "Reason must be at least 5 characters"),
  costValue: z.string().optional(),
  recoveryValue: z.string().optional(),
  notes: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
  allocationType: z.enum(["online", "store", "both"]).optional(),
  stockReductions: z.record(z.string().transform((val) => parseInt(val) || 0)),
  reportedBy: z.string().min(1, "Reported by is required"),
  status: z.enum(["pending", "approved", "rejected", "processed"]).default("pending"),
});

// Type exports for frontend
export type StoreCustomer = typeof tables.store_customers.$inferSelect;
export type CustomerPurchase = {
  id: string;
  saleId: string;
  customerName: string;
  customerPhone: string;
  totalAmount: string;
  discountAmount: string;
  paymentMode: string;
  createdAt: Date;
  items: CustomerPurchaseItem[];
};

export type CustomerPurchaseItem = {
  id: string;
  productId: string;
  quantity: number; // notNull in database
  price: string;
  returnedQuantity: number; // notNull in database
  product: {
    id: string;
    name: string;
    code: string;
    imageUrl: string;
    category: { name: string } | null;
    color: { name: string } | null;
    fabric: { name: string } | null;
  } | null;
};
