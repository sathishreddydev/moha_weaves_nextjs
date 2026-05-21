"use client";

import { Button } from "@/components/ui/button";
import { UserAddress } from "@/shared/types";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";

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
  // Add pricing breakdown for verification
  subtotal?: number;
  shipping?: number;
  discountAmount?: number;
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
  subtotal,
  shipping,
  discountAmount,
}: RazorpayPaymentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  // Safety ref: if the modal never resolves (dismiss/success/fail), reset after timeout
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track whether the Razorpay modal is currently open
  const modalOpenRef = useRef(false);
  // Track the active Razorpay instance so we can close it on unmount
  const razorpayInstanceRef = useRef<any>(null);

  const clearLoadingTimeout = () => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  };

  const resetLoading = () => {
    clearLoadingTimeout();
    modalOpenRef.current = false;
    setIsLoading(false);
  };

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  // If the user navigates away while the modal is open, close it cleanly
  // so Razorpay doesn't leave a zombie overlay on the next page.
  useEffect(() => {
    return () => {
      clearLoadingTimeout();
      if (razorpayInstanceRef.current) {
        try { razorpayInstanceRef.current.close(); } catch {}
        razorpayInstanceRef.current = null;
      }
    };
  }, []);

  // ── Visibility / focus recovery ───────────────────────────────────────────
  // When the user switches back to this tab and the modal is no longer visible
  // (they navigated away in another tab, or the modal closed without firing ondismiss),
  // reset the loading state so the button isn't stuck on "Processing...".
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && modalOpenRef.current) {
        // Give Razorpay 800ms to fire ondismiss first; if it doesn't, reset ourselves
        setTimeout(() => {
          if (modalOpenRef.current) {
            resetLoading();
          }
        }, 800);
      }
    };

    const handleFocus = () => {
      if (modalOpenRef.current) {
        setTimeout(() => {
          if (modalOpenRef.current) {
            resetLoading();
          }
        }, 800);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // Safety net: if the modal never resolves within 10 minutes, reset the button.
    // Covers edge cases like browser crash/reopen, Razorpay JS errors, etc.
    clearLoadingTimeout();
    loadingTimeoutRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 10 * 60 * 1000); // 10 minutes — matches Razorpay order expiry

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
        resetLoading();
        const data = await response.json().catch(() => ({}));
        onError(data.message || "Failed to initiate payment. Please try again.");
        return;
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
            razorpayInstanceRef.current = null;
            resetLoading();
            toast.info("Payment cancelled. Your cart is saved.");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpayInstanceRef.current = razorpay;
      modalOpenRef.current = true;
      razorpay.open();

      razorpay.on("payment.failed", function (response: any) {
        resetLoading();
        onError(response.error?.description || "Payment failed. Please try again.");
      });
    } catch (error) {
      resetLoading();
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
      razorpayInstanceRef.current = null;
      clearLoadingTimeout(); // success — no need for the safety timeout anymore
      onSuccess(result.orderId);
      toast.success("Payment successful! Order placed.");
    } catch (error) {
      resetLoading();
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
          amount > 0 ? `Pay ₹${amount}` : "Place Order"
        )}
      </Button>
  );
}
