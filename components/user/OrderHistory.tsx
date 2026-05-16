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
import { OrderWithItems } from "@/shared";
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Package,
  RefreshCw,
  RotateCcw,
  Truck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import ShippingAddress from "./shippingAddress";
import OrderSkeleton from "./OrderSkeleton";
import { useRouter } from "next/navigation";
import { useOrderItemStatusListenerList } from "@/hooks/useProductPurchasedListener";

// Full status config matching all possible item statuses
const STATUS_CONFIG: Record<string, { label: string; className: string; Icon: any }> = {
  pending:                   { label: "Pending",             className: "text-yellow-600",  Icon: Clock },
  confirmed:                 { label: "Confirmed",           className: "text-blue-600",    Icon: CheckCircle },
  processing:                { label: "Processing",          className: "text-purple-600",  Icon: Package },
  shipped:                   { label: "Shipped",             className: "text-indigo-600",  Icon: Truck },
  delivered:                 { label: "Delivered",           className: "text-green-600",   Icon: CheckCircle },
  cancelled:                 { label: "Cancelled",           className: "text-red-500",     Icon: Ban },
  return_requested:          { label: "Return Requested",    className: "text-orange-500",  Icon: RotateCcw },
  return_approved:           { label: "Return Approved",     className: "text-orange-600",  Icon: RotateCcw },
  return_pickup_scheduled:   { label: "Pickup Scheduled",    className: "text-orange-600",  Icon: RotateCcw },
  return_picked_up:          { label: "Picked Up",           className: "text-orange-600",  Icon: RotateCcw },
  return_in_transit:         { label: "Return In Transit",   className: "text-orange-600",  Icon: Truck },
  return_received:           { label: "Return Received",     className: "text-orange-700",  Icon: RotateCcw },
  return_inspected:          { label: "Inspected",           className: "text-orange-700",  Icon: RotateCcw },
  return_completed:          { label: "Return Completed",    className: "text-green-600",   Icon: CheckCircle },
  return_cancelled:          { label: "Return Cancelled",    className: "text-red-500",     Icon: Ban },
  exchange_requested:        { label: "Exchange Requested",  className: "text-blue-500",    Icon: RefreshCw },
  exchange_approved:         { label: "Exchange Approved",   className: "text-blue-600",    Icon: RefreshCw },
  exchange_processing:       { label: "Exchange Processing", className: "text-blue-600",    Icon: RefreshCw },
  exchange_pickup_scheduled: { label: "Pickup Scheduled",    className: "text-blue-600",    Icon: RefreshCw },
  exchange_picked_up:        { label: "Picked Up",           className: "text-blue-600",    Icon: RefreshCw },
  exchange_in_transit:       { label: "Exchange In Transit", className: "text-blue-600",    Icon: Truck },
  exchange_received:         { label: "Exchange Received",   className: "text-blue-700",    Icon: RefreshCw },
  exchange_inspected:        { label: "Inspected",           className: "text-blue-700",    Icon: RefreshCw },
  exchange_shipped:          { label: "Exchange Shipped",    className: "text-indigo-600",  Icon: Truck },
  exchange_delivered:        { label: "Exchange Delivered",  className: "text-green-600",   Icon: CheckCircle },
  exchange_completed:        { label: "Exchange Completed",  className: "text-green-600",   Icon: CheckCircle },
  exchange_cancelled:        { label: "Exchange Cancelled",  className: "text-red-500",     Icon: Ban },
};

const MAX_PAGE_BUTTONS = 5;

export default function OrderHistory() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [ordersPerPage, setOrdersPerPage] = useState(5);

  const pageSizeOptions = [5, 10, 20, 50];
  const router = useRouter();

  const fetchOrders = async (
    page: number = currentPage,
    pageSize: number = ordersPerPage,
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/orders?page=${page}&pageSize=${pageSize}`);

      if (!response.ok) throw new Error("Failed to fetch orders");

      const result = await response.json();
      setOrders(result.data || []);
      setTotalPages(result.totalPages || 0);
      setCurrentPage(result.page || page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useOrderItemStatusListenerList(setOrders);

  const handlePageChange = (page: number) => fetchOrders(page);

  const handlePageSizeChange = (newPageSize: number) => {
    setOrdersPerPage(newPageSize);
    setCurrentPage(1);
    fetchOrders(1, newPageSize);
  };

  // Build a windowed page list: always show first, last, current ±1, with ellipsis
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

  if (loading) return <OrderSkeleton />;

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-red-600 mb-3">Error loading orders: {error}</p>
        <Button onClick={() => fetchOrders()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile back header */}
      <div
        onClick={() => router.push("/my")}
        className="flex items-center gap-4 cursor-pointer lg:hidden"
      >
        <ArrowLeft className="w-6 h-6 text-gray-800" />
        <h1 className="text-xl font-semibold text-gray-900">Order History</h1>
      </div>

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
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Order header */}
                <div className="p-3 border-b border-gray-200 bg-gray-50">
                  <div className="flex flex-wrap justify-between items-center gap-4">
                    <div className="flex gap-6">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">
                          Order Placed
                        </p>
                        <p className="text-xs font-semibold">
                          {formatDate(order.createdAt, "en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">
                          Total
                        </p>
                        <p className="text-xs font-semibold">
                          ₹{parseFloat(order.finalAmount).toFixed(2)}
                        </p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">
                          Order #
                        </p>
                        <p className="text-xs font-semibold">{order.id}</p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">
                          Shipping to:
                        </p>
                        <ShippingAddress address={order.shippingAddress} />
                      </div>
                    </div>
                    <Link
                      href={`/my/orders/${order.id}`}
                      className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider border-b border-black pb-2 transition-all"
                    >
                      <span>View Details</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </div>
                </div>

                {/* Order items */}
                <div className="p-3 space-y-4">
                  {order.items?.map((item) => {
                    const currentStatus = (item as any).currentStatus || item.status || "pending";
                    const cfg = STATUS_CONFIG[currentStatus] ?? STATUS_CONFIG.pending;
                    const StatusIcon = cfg.Icon;

                    // Resolve variant by variantId
                    const selectedVariant = item.variantId
                      ? item.product?.variants?.find((v: any) => v.id === item.variantId)
                      : item.product?.variants?.[0];

                    return (
                      <div key={item.id} className="flex gap-4">
                        {/* Image */}
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {item.product?.imageUrl ? (
                            <img
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-medium text-gray-900 truncate">
                              {item.product?.name || "Product"}
                            </h4>
                            {/* Status badge */}
                            <div className={`flex items-center gap-1 flex-shrink-0 ${cfg.className}`}>
                              <StatusIcon className="w-3 h-3" />
                              <span className="text-[10px] font-semibold whitespace-nowrap">
                                {cfg.label}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500">
                              Qty: {item.quantity}
                            </span>
                            {selectedVariant?.size && (
                              <span className="text-[10px] text-gray-500">
                                Size: {selectedVariant.size}
                              </span>
                            )}
                          </div>

                          <div className="text-xs font-medium text-gray-900">
                            ₹{parseFloat(item.price).toFixed(2)}
                          </div>

                          {/* Return / exchange eligibility badge */}
                          {item.returnEligibility && (
                            <div className="flex items-center gap-1">
                              {item.returnEligibility.eligible ? (
                                <div className="flex items-center gap-1 text-green-600">
                                  <RotateCcw className="w-3 h-3" />
                                  <span className="text-[10px] font-medium">
                                    Returnable
                                    {item.returnEligibility.remainingDays
                                      ? ` (${item.returnEligibility.remainingDays}d left)`
                                      : ""}
                                  </span>
                                </div>
                              ) : (item as any).exchangeEligibility?.eligible ? (
                                <div className="flex items-center gap-1 text-blue-600">
                                  <RefreshCw className="w-3 h-3" />
                                  <span className="text-[10px] font-medium">
                                    Exchange only
                                    {(item as any).exchangeEligibility.remainingDays
                                      ? ` (${(item as any).exchangeEligibility.remainingDays}d left)`
                                      : ""}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-gray-400">
                                  <XCircle className="w-3 h-3" />
                                  <span className="text-[10px] font-medium">
                                    {item.returnEligibility.reason || "Non-returnable"}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 pt-4">
              {/* Page size selector */}
              <Select
                value={ordersPerPage.toString()}
                onValueChange={(v) => handlePageSizeChange(Number(v))}
              >
                <SelectTrigger className="w-16 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

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
                  <span key={`ellipsis-${idx}`} className="text-xs text-gray-400 px-1">
                    …
                  </span>
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
                ),
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
            </div>
          )}
        </>
      )}
    </div>
  );
}
