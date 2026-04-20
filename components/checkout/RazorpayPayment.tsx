"use client";

import { Button } from "@/components/ui/button";
import { UserAddress } from "@/shared/types";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

declare global {
  interface Window {
    Razorpay: new (options: any) => any;
  }
}

interface RazorpayPaymentProps {
  amount: number;
  user: any;
  selectedAddress?: UserAddress;
  notes?: string;
  couponId?: string | null;
  onSuccess: (orderId: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export default function RazorpayPayment({
  amount,
  user,
  selectedAddress,
  notes,
  couponId,
  onSuccess,
  onError,
  disabled = false,
}: RazorpayPaymentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Check if Razorpay is available
  useEffect(() => {
    if (window.Razorpay) {
      setScriptLoaded(true);
    }
  }, []);

  // Fallback loader if Script component fails
  const loadRazorpayFallback = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        setScriptLoaded(true);
        resolve(true);
      };
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!window.Razorpay) {
      // Try fallback loader
      const loaded = await loadRazorpayFallback();
      if (!loaded || !window.Razorpay) {
        onError("Razorpay not loaded. Please refresh the page.");
        return;
      }
    }

    setIsLoading(true);

    try {
      // Create Razorpay order
      const response = await fetch("/api/razorpay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          couponId: couponId || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create Razorpay order");
      }

      const { razorpayOrderId, amount: razorpayAmount, currency } = await response.json();

      // Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: razorpayAmount,
        currency: currency,
        name: "Mohaweavs",
        description: "Purchase from Mohaweavs",
        order_id: razorpayOrderId,
        handler: async (response: any) => {
          await handlePaymentSuccess(response);
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: selectedAddress?.phone || "",
        },
        theme: {
          color: "#3399cc",
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
            toast.info("Payment cancelled");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

      razorpay.on("payment.failed", function (response: any) {
        console.error("Payment failed:", response);
        setIsLoading(false);
        onError(response.error?.description || "Payment failed. Please try again.");
      });
    } catch (error) {
      console.error("Razorpay payment error:", error);
      setIsLoading(false);
      onError(error instanceof Error ? error.message : "Payment failed. Please try again.");
    }
  };

  const handlePaymentSuccess = async (paymentResponse: any) => {
    try {
      const response = await fetch("/api/verify-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          razorpayOrderId: paymentResponse.razorpay_order_id,
          razorpayPaymentId: paymentResponse.razorpay_payment_id,
          razorpaySignature: paymentResponse.razorpay_signature,
          shippingAddress: selectedAddress,
          phone: selectedAddress?.phone,
          notes: notes,
          couponId: couponId || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Payment verification failed");
      }

      const result = await response.json();
      onSuccess(result.orderId);
      toast.success("Payment successful! Order placed.");
    } catch (error) {
      console.error("Payment verification error:", error);
      setIsLoading(false);
      onError(error instanceof Error ? error.message : "Payment verification failed. Please contact support.");
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || isLoading}
      size="lg"
      className="w-full"
    >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay ${amount > 0 ? `₹${amount}` : ''}`
        )}
      </Button>
  );
}
