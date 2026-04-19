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
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Package,
  RotateCcw,
  Truck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import ShippingAddress from "./shippingAddress";
import OrderSkeleton from "./OrderSkeleton";
import { useRouter } from "next/navigation";

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

      const response = await fetch(
        `/api/orders?page=${page}&pageSize=${pageSize}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const result = await response.json();

      // Handle paginated response format
      const ordersData = result.data || [];

      setOrders(ordersData);
      setTotalPages(result.totalPages || 0);
      setCurrentPage(result.page || page);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch orders");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const currentOrders = orders;

  const handlePageChange = (page: number) => {
    fetchOrders(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setOrdersPerPage(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
    fetchOrders(1, newPageSize);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="text-red-600 text-center">
            <p>Error loading orders: {error}</p>
            <Button onClick={() => fetchOrders()} className="mt-2">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }
  const handleBack = () => {
    router.push("/my");
  };
  return (
    <div className="space-y-4">
      <div
        onClick={handleBack}
        className="flex items-center gap-4 cursor-pointer lg:hidden"
      >
        <ArrowLeft className="w-6 h-6 text-gray-500" color="#1F2937" />

        <h1 className="text-xl font-semibold text-gray-900">Addresses</h1>
      </div>
      <div>
        {loading ? (
          <OrderSkeleton />
        ) : orders.length === 0 ? (
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
              {currentOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
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

                  {/* Order Items */}
                  <div className="p-3">
                    <div className="space-y-4">
                      {order.items?.map((item) => (
                        <div key={item.id} className="flex gap-4">
                          {/* Product Image */}
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

                          {/* Product Details */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-medium text-gray-900 truncate">
                                {item.product?.name || "Product"}
                              </h4>
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const status =
                                    (item as any).currentStatus || item.status;
                                  const statusConfig = {
                                    pending: {
                                      icon: Clock,
                                      color: "text-yellow-600",
                                      bg: "bg-yellow-50",
                                    },
                                    confirmed: {
                                      icon: CheckCircle,
                                      color: "text-blue-600",
                                      bg: "bg-blue-50",
                                    },
                                    processing: {
                                      icon: Package,
                                      color: "text-purple-600",
                                      bg: "bg-purple-50",
                                    },
                                    shipped: {
                                      icon: Truck,
                                      color: "text-green-600",
                                      bg: "bg-green-50",
                                    },
                                    delivered: {
                                      icon: CheckCircle,
                                      color: "text-green-600",
                                      bg: "bg-green-50",
                                    },
                                    cancelled: {
                                      icon: XCircle,
                                      color: "text-red-600",
                                      bg: "bg-red-50",
                                    },
                                  };
                                  const config =
                                    statusConfig[
                                      status as keyof typeof statusConfig
                                    ] || statusConfig.pending;
                                  const Icon = config.icon;

                                  return (
                                    <div
                                      className={`flex items-center gap-1 ${config.color}`}
                                    >
                                      <Icon className="w-3 h-3" />
                                      <span className="text-xs font-medium capitalize">
                                        {status}
                                      </span>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-500">
                                Qty: {item.quantity}
                              </span>
                              {(() => {
                                if (item.variantId && item.product.variants) {
                                  const selectedVariant =
                                    item.product.variants.find(
                                      (v) => v.id === item.variantId,
                                    );
                                  return selectedVariant?.size ? (
                                    <span className="text-[10px] text-gray-500">
                                      Size: {selectedVariant.size}
                                    </span>
                                  ) : null;
                                }
                                return null;
                              })()}
                            </div>
                            <div>
                              <div className="text-xs font-medium text-gray-900">
                                ₹{parseFloat(item.price).toFixed(2)}
                              </div>
                            </div>
                            {item.returnEligibility && (
                              <div className="flex items-center gap-1">
                                {item.returnEligibility.eligible ? (
                                  <div className="flex items-center gap-1 text-green-600">
                                    <RotateCcw className="w-3 h-3" />
                                    <span className="text-[10px] font-medium">
                                      Returnable
                                      {item.returnEligibility.remainingDays &&
                                        ` (${item.returnEligibility.remainingDays} days left)`}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 text-gray-400">
                                    <RotateCcw className="w-3 h-3" />
                                    <span className="text-[10px] font-medium">
                                      {item.returnEligibility.reason ||
                                        "Non-returnable"}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-end pt-6">
                <div className="flex items-center space-x-2">
                  <Select
                    value={ordersPerPage.toString()}
                    onValueChange={(value) =>
                      handlePageSizeChange(Number(value))
                    }
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
                    className="flex items-center space-x-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      ),
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center space-x-1"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
