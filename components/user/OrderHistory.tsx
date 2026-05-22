"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/formatters";
import { getStatusConfig } from "@/lib/orderStatus";
import { OrderWithItems } from "@/shared";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ShippingAddress from "./shippingAddress";
import OrderSkeleton from "./OrderSkeleton";
import { useRouter } from "next/navigation";
import {
  useOrderItemStatusListenerList,
  useReturnCreatedListener,
  useExchangeCreatedListener,
} from "@/hooks/useProductPurchasedListener";

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_PAGE_BUTTONS = 5;
const STORAGE_KEY = "orderHistory_pagination";
// Set before navigating into an order detail; cleared on mount so a fresh
// visit always starts at page 1 while back-navigation restores the saved page.
const RESTORE_KEY = "orderHistory_restorePagination";
const pageSizeOptions = [5, 10, 20, 50];

const STATUS_PRIORITY = [
  "pending", "confirmed", "processing", "shipped", "delivered",
  "return_requested", "return_approved", "return_pickup_scheduled",
  "return_picked_up", "return_in_transit", "return_received",
  "return_inspected", "return_completed", "return_rejected", "return_cancelled",
  "exchange_requested", "exchange_approved", "exchange_processing",
  "exchange_pickup_scheduled", "exchange_picked_up", "exchange_in_transit",
  "exchange_received", "exchange_inspected", "exchange_shipped",
  "exchange_delivered", "exchange_completed", "exchange_cancelled", "cancelled",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function deriveOrderStatus(items: OrderWithItems["items"]): string {
  if (!items || items.length === 0) return "pending";
  let best = "pending";
  let bestIdx = STATUS_PRIORITY.indexOf("pending");
  for (const item of items) {
    const s = (item as any).currentStatus || item.status || "pending";
    const idx = STATUS_PRIORITY.indexOf(s);
    if (idx > bestIdx) { bestIdx = idx; best = s; }
  }
  return best;
}

function readSavedPagination(): { page: number; pageSize: number } {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { page: 1, pageSize: 5 };
    const parsed = JSON.parse(raw);
    const page = Math.max(1, parseInt(parsed.page, 10) || 1);
    const pageSize = pageSizeOptions.includes(parseInt(parsed.pageSize, 10))
      ? parseInt(parsed.pageSize, 10)
      : 5;
    return { page, pageSize };
  } catch {
    return { page: 1, pageSize: 5 };
  }
}

function savePagination(page: number, pageSize: number) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ page, pageSize }));
  } catch {
    // sessionStorage unavailable — silently ignore
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function OrderHistory() {
  const router = useRouter();

  // Restore pagination only when coming back from an order detail page.
  // On a fresh visit the flag is absent, so we always start at page 1.
  const [currentPage, setCurrentPage] = useState<number>(() => {
    if (typeof window === "undefined") return 1;
    const shouldRestore = sessionStorage.getItem(RESTORE_KEY) === "1";
    if (shouldRestore) {
      sessionStorage.removeItem(RESTORE_KEY);
      return readSavedPagination().page;
    }
    // Fresh load — reset saved page to 1 so the next back-navigation is sane
    const saved = readSavedPagination();
    savePagination(1, saved.pageSize);
    return 1;
  });
  const [ordersPerPage, setOrdersPerPage] = useState<number>(() => {
    if (typeof window === "undefined") return 5;
    return readSavedPagination().pageSize;
  });

  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);

  const fetchOrders = useCallback(async (page: number, pageSize: number) => {
    try {
      setIsFetching(true);
      setError(null);
      const response = await fetch(`/api/orders?page=${page}&pageSize=${pageSize}`);
      if (!response.ok) throw new Error("Failed to fetch orders");
      const result = await response.json();
      setOrders(result.data || []);
      setTotalPages(result.totalPages || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch orders");
    } finally {
      setIsFetching(false);
      setInitialLoading(false);
    }
  }, []);

  // Fetch on mount and whenever page/pageSize changes
  useEffect(() => {
    fetchOrders(currentPage, ordersPerPage);
  }, [currentPage, ordersPerPage, fetchOrders]);

  useOrderItemStatusListenerList(setOrders);

  const handleReturnExchangeCreated = useCallback(() => {
    fetchOrders(currentPage, ordersPerPage);
  }, [fetchOrders, currentPage, ordersPerPage]);

  useReturnCreatedListener(null, handleReturnExchangeCreated);
  useExchangeCreatedListener(null, handleReturnExchangeCreated);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    savePagination(page, ordersPerPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setOrdersPerPage(newPageSize);
    setCurrentPage(1);
    savePagination(1, newPageSize);
  };

  const getPageNumbers = (): (number | "...")[] => {
    if (totalPages <= MAX_PAGE_BUTTONS) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "...")[] = [1];
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    if (start > 2) pages.push("...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  if (initialLoading) return <OrderSkeleton />;

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-red-600 mb-3">Error loading orders: {error}</p>
        <Button onClick={() => fetchOrders(currentPage, ordersPerPage)}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile back header */}
      <button
        type="button"
        aria-label="Back to account"
        onClick={() => router.push("/my")}
        className="flex items-center gap-4 lg:hidden"
      >
        <ArrowLeft className="w-6 h-6 text-gray-800" />
        <h1 className="text-xl font-semibold text-gray-900">Order History</h1>
      </button>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No orders yet</p>
          <Button asChild>
            <Link href="/collections">Start Shopping</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className={`space-y-4 transition-opacity duration-200 ${isFetching ? "opacity-50 pointer-events-none" : ""}`}>
            {orders.map((order) => {
              const overallStatus = deriveOrderStatus(order.items);
              const overallCfg = getStatusConfig(overallStatus);
              const OverallIcon = overallCfg.Icon;

              return (
                <Link
                  key={order.id}
                  href={`/my/orders/${order.id}`}
                  onClick={() => {
                    try { sessionStorage.setItem(RESTORE_KEY, "1"); } catch { /* ignore */ }
                  }}
                  className="block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Order header */}
                  <div className="p-3 border-b border-gray-200 bg-gray-50">
                    <div className="flex flex-wrap justify-between items-center gap-4">
                      <div className="flex gap-6 flex-wrap">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Order Placed</p>
                          <p className="text-xs font-semibold">
                            {formatDate(order.createdAt, "en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Total</p>
                          <p className="text-xs font-semibold">₹{parseFloat(order.finalAmount).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Order #</p>
                          <p className="text-xs font-semibold sm:hidden">
                            {order.id.length > 8 ? `…${order.id.slice(-8)}` : order.id}
                          </p>
                          <p className="text-xs font-semibold hidden sm:block">{order.id}</p>
                        </div>
                        <div className="hidden sm:block">
                          <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Shipping to:</p>
                          <ShippingAddress address={order.shippingAddress} />
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Status</p>
                          <div className={`flex items-center gap-1 ${overallCfg.className}`}>
                            <OverallIcon className="w-3 h-3" />
                            <span className="text-xs font-semibold whitespace-nowrap">{overallCfg.label}</span>
                          </div>
                        </div>
                      </div>
                      <span
                        className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider border-b border-black pb-2 transition-all"
                        aria-hidden="true"
                      >
                        <span>View Details</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </span>
                    </div>
                  </div>

                  {/* Order items */}
                  <div className="p-3 space-y-4">
                    {order.items?.map((item) => {
                      const currentStatus = (item as any).currentStatus || item.status || "pending";
                      const cfg = getStatusConfig(currentStatus);
                      const StatusIcon = cfg.Icon;
                      const selectedVariant = item.variantId
                        ? item.product?.variants?.find((v: any) => v.id === item.variantId)
                        : item.product?.variants?.[0];

                      return (
                        <div key={item.id} className="flex gap-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {item.product?.imageUrl ? (
                              <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-xs font-medium text-gray-900 truncate">
                                {item.product?.name || "Product"}
                              </h4>
                              <div className={`flex items-center gap-1 flex-shrink-0 ${cfg.className}`}>
                                <StatusIcon className="w-3 h-3" />
                                <span className="text-[10px] font-semibold whitespace-nowrap">{cfg.label}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-500">Qty: {item.quantity}</span>
                              {selectedVariant?.size && (
                                <span className="text-[10px] text-gray-500">Size: {selectedVariant.size}</span>
                              )}
                            </div>
                            <div className="text-xs font-medium text-gray-900">
                              ₹{parseFloat(item.price).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-end gap-2 pt-4">
            <Select
              value={ordersPerPage.toString()}
              onValueChange={(v) => handlePageSizeChange(Number(v))}
            >
              <SelectTrigger className="w-16 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {totalPages > 1 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {getPageNumbers().map((page, idx) =>
                  page === "..." ? (
                    <span key={`ellipsis-${idx}`} className="text-xs text-gray-400 px-1">…</span>
                  ) : (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page as number)}
                      className="h-8 w-8 p-0"
                    >
                      {page}
                    </Button>
                  )
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
