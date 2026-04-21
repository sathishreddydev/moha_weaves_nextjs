import { Card } from "@/components/ui/card";
import { Button } from "../ui/button";
import {
  MapPin,
  Star,
  Clock,
  Package,
  Map,
  XCircle,
  RotateCcw,
  RefreshCw,
} from "lucide-react";

export function OrderItem({
  item,
  onReview,
  onReturn,
}: {
  item: any;
  onReview: (orderItemId: string, productId: string) => void;
  onReturn: (itemId: string, type: "return" | "exchange") => void;
}) {
  return (
    <Card className="p-4 hover:border-slate-300 transition-colors bg-white">
      <div className="flex gap-4">
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

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div>
              <h4 className="text-xs font-medium text-gray-900 truncate">
                {item.product?.name || "Product"}
              </h4>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                  Qty: {item.quantity}
                </span>
                {item.product.variants?.[0]?.size && (
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                    Size: {item.product.variants[0].size}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              {/* Enhanced Pricing Display */}
              {item.productPrice &&
              item.discountedPrice &&
              item.productPrice !== item.discountedPrice ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 justify-end">
                    <span className="text-xs text-gray-400 line-through">
                      ₹{parseFloat(item.productPrice).toFixed(2)}
                    </span>
                    <span className="text-xs font-bold text-green-600">
                      ₹{parseFloat(item.discountedPrice).toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs font-bold">
                    ₹{parseFloat(item.price).toFixed(2)}
                  </p>
                  <div className="text-[10px] text-gray-500">
                    Qty: {item.quantity}
                  </div>
                </div>
              )}
              {item.status !== "delivered" && (
                <button className="text-[10px] font-bold text-indigo-600 hover:underline mt-1 flex items-center gap-1">
                  <Map className="w-3 h-3" />
                  Track Item
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center pt-4 border-t border-slate-50">
        {item.status === "delivered" ? (
          <button
            className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center transition-colors"
            onClick={() => onReview(item.id, item.product.id)}
          >
            <Star className="w-3.5 h-3.5 mr-2 text-yellow-500 fill-yellow-500" />
            Rate & Review
          </button>
        ) : (
          <div className="flex items-center text-indigo-600">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-semibold">In Transit</span>
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {item.returnEligibility?.eligible ? (
            <>
              <button
                onClick={() => onReturn(item.id, "return")}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Return
              </button>
              <div className="w-1 h-1 bg-slate-300 rounded-full" />
              <button
                onClick={() => onReturn(item.id, "exchange")}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Exchange
              </button>
            </>
          ) : (
            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              {item.returnEligibility?.reason || "Non-returnable"}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
