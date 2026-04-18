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
import { Star, AlertCircle } from "lucide-react";
import { OrderWithItems } from "@/shared";

interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderWithItems;
  orderItemId: string;
  productId: string;
}

export default function ReviewModal({
  open,
  onOpenChange,
  order,
  orderItemId,
  productId,
}: ReviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("test");
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const orderItem = order.items?.find((item) => item.id === orderItemId);

  const handleSubmit = async () => {
    if (!comment.trim()) {
      setError("Please provide a review comment");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit review");
      }

      const result = await response.json();

      // Close modal and show success message
      onOpenChange(false);

      // Reset form
      setRating(5);
      setComment("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  if (!orderItem) return null;

  const ModalContent = () => (
    <>
      <Header />
      <div className="space-y-4">
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
                {orderItem.product?.color?.name &&
                  ` | ${orderItem.product.color.name}`}
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">
                  Qty: {orderItem.quantity}
                </span>
                <span className="text-sm font-medium">
                  ¥{parseFloat(orderItem.price).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Rating Selection */}
        <div className="space-y-2">
          <Label>Rating</Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-1 hover:scale-110 transition-transform"
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
          <p className="text-xs text-gray-500">
            {rating === 1 && "Poor"}
            {rating === 2 && "Fair"}
            {rating === 3 && "Good"}
            {rating === 4 && "Very Good"}
            {rating === 5 && "Excellent"}
          </p>
        </div>

        {/* Review Comment */}
        <div className="space-y-2">
          <Label htmlFor="comment">Your Review</Label>
          <Textarea
            id="comment"
            placeholder="Share your experience with this product..."
            onChange={(e) => {
              console.log(e.target.value);
            }}
            rows={4}
            maxLength={500}
          />
          <p className="text-xs text-gray-500">
            {comment.length}/500 characters
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>

      <Footer />
    </>
  );

  const Header = () =>
    isMobile ? (
      <DrawerHeader>
        <DrawerTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          Write Review
        </DrawerTitle>
        <DrawerDescription>
          Share your experience with this product
        </DrawerDescription>
      </DrawerHeader>
    ) : (
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          Write Review
        </DialogTitle>
        <DialogDescription>
          Share your experience with this product
        </DialogDescription>
      </DialogHeader>
    );

  const Footer = () =>
    isMobile ? (
      <DrawerFooter>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Submitting..." : "Submit Review"}
        </Button>
      </DrawerFooter>
    ) : (
      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Submitting..." : "Submit Review"}
        </Button>
      </DialogFooter>
    );

  return (
    <>
      {isMobile ? (
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent>
            <ModalContent />
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent>
            <ModalContent />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
