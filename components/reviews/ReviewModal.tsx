"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, AlertCircle, CheckCircle } from "lucide-react";
import { OrderWithItems } from "@/shared";

interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderWithItems;
  orderItemId: string;
  productId: string;
}

const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

export default function ReviewModal({
  open,
  onOpenChange,
  order,
  orderItemId,
  productId,
}: ReviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const orderItem = order.items?.find((item) => item.id === orderItemId);

  const resetForm = () => {
    setRating(5);
    setComment("");
    setError("");
    setSuccess(false);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) resetForm();
    onOpenChange(value);
  };

  const handleSubmit = async () => {
    if (!comment.trim()) {
      setError("Please write a review comment");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit review");
      }

      setSuccess(true);
      // Auto-close after showing success
      setTimeout(() => handleOpenChange(false), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  if (!orderItem) return null;

  const titleContent = (
    <>
      <Star className="w-5 h-5" />
      Write a Review
    </>
  );

  const content = (
    <div className="px-4 space-y-4">
      {/* Success state */}
      {success ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-500" />
          <p className="text-sm font-medium text-gray-900">Review submitted!</p>
          <p className="text-xs text-gray-500">Thank you for your feedback.</p>
        </div>
      ) : (
        <>
          {/* Item Details */}
          <div className="border rounded-lg p-3 bg-gray-50">
            <div className="flex gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                {orderItem.product?.imageUrl ? (
                  <img
                    src={orderItem.product.imageUrl}
                    alt={orderItem.product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Star className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">
                  {orderItem.product?.name || "Product"}
                </h4>
                <p className="text-xs text-gray-500">
                  {orderItem.product?.category?.name}
                  {orderItem.product?.color?.name && ` | ${orderItem.product.color.name}`}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500">Qty: {orderItem.quantity}</span>
                  <span className="text-sm font-medium">
                    ₹{parseFloat(orderItem.price).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Star Rating */}
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                  aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500">{RATING_LABELS[rating]}</p>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="review-comment">Your Review</Label>
            <Textarea
              id="review-comment"
              placeholder="Share your experience with this product..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 text-right">{comment.length}/500</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </>
      )}
    </div>
  );

  const footerButtons = !success && (
    <>
      <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
        Cancel
      </Button>
      <Button onClick={handleSubmit} disabled={loading || !comment.trim()}>
        {loading ? "Submitting..." : "Submit Review"}
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">{titleContent}</DrawerTitle>
            <DrawerDescription>Share your experience with this product</DrawerDescription>
          </DrawerHeader>
          {content}
          {footerButtons && <DrawerFooter>{footerButtons}</DrawerFooter>}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">{titleContent}</DialogTitle>
          <DialogDescription>Share your experience with this product</DialogDescription>
        </DialogHeader>
        {content}
        {footerButtons && <DialogFooter>{footerButtons}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
