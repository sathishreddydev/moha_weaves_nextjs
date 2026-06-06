"use client";

import { Button } from "@/components/ui/button";
import { UserAddress } from "@/shared/types";
import {
  AlertCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { formatPrice } from "@/lib/formatters";

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
  const [confirmedAmount, setConfirmedAmount] = useState<number | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [failureCount, setFailureCount] = useState(0);

  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modalOpenRef = useRef(false);
  const razorpayInstanceRef = useRef<any>(null);
  const razorpayOrderRef = useRef<{
    id: string;
    amount: number;
    currency: string;
  } | null>(null);

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

  // Pre-fetch server amount
  useEffect(() => {
    if (disabled || !selectedAddress) {
      setConfirmedAmount(null);
      razorpayOrderRef.current = null;
      return;
    }

    let cancelled = false;
    const fetchAmount = async () => {
      try {
        const res = await fetch("/api/razorpay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            couponId: couponId || undefined,
            previewOnly: true,
          }),
        });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled) {
          setConfirmedAmount(data.amount / 100);
          razorpayOrderRef.current = null;
        }
      } catch {
        // Non-critical
      }
    };

    fetchAmount();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, selectedAddress?.id, couponId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearLoadingTimeout();
      if (razorpayInstanceRef.current) {
        try {
          razorpayInstanceRef.current.close();
        } catch {}
        razorpayInstanceRef.current = null;
      }
    };
  }, []);

  // Visibility / focus recovery
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && modalOpenRef.current) {
        setTimeout(() => {
          if (modalOpenRef.current) resetLoading();
        }, 800);
      }
    };
    const handleFocus = () => {
      if (modalOpenRef.current) {
        setTimeout(() => {
          if (modalOpenRef.current) resetLoading();
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

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!window.Razorpay) {
      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        onError("Razorpay not loaded. Please refresh the page.");
        return;
      }
    }

    setPaymentError(null);
    setIsLoading(true);

    clearLoadingTimeout();
    loadingTimeoutRef.current = setTimeout(
      () => setIsLoading(false),
      10 * 60 * 1000,
    );

    try {
      const response = await fetch("/api/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponId: couponId || undefined }),
      });

      if (!response.ok) {
        resetLoading();
        const data = await response.json().catch(() => ({}));
        const msg =
          data.message || "Failed to initiate payment. Please try again.";
        setPaymentError(msg);
        onError(msg);
        return;
      }

      const {
        razorpayOrderId,
        amount: razorpayAmount,
        currency,
      } = await response.json();
      setConfirmedAmount(razorpayAmount / 100);

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: razorpayAmount,
        currency,
        name: "Urumi",
        description: "Purchase from Urumi",
        order_id: razorpayOrderId,
        handler: async (paymentResponse: any) => {
          await handlePaymentSuccess(paymentResponse);
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: selectedAddress?.phone || "",
        },
        theme: { color: "#111827" },
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

      razorpay.on("payment.failed", (failResponse: any) => {
        resetLoading();
        const errorMsg =
          failResponse.error?.description ||
          failResponse.error?.reason ||
          "Payment failed. Please try again.";
        setFailureCount((c) => c + 1);
        setPaymentError(errorMsg);
        onError(errorMsg);
      });
    } catch (error) {
      resetLoading();
      const msg =
        error instanceof Error
          ? error.message
          : "Payment failed. Please try again.";
      setPaymentError(msg);
      onError(msg);
    }
  };

  const handlePaymentSuccess = async (paymentResponse: any) => {
    try {
      const response = await fetch("/api/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpayOrderId: paymentResponse.razorpay_order_id,
          razorpayPaymentId: paymentResponse.razorpay_payment_id,
          razorpaySignature: paymentResponse.razorpay_signature,
          shippingAddress: selectedAddress,
          phone: selectedAddress?.phone,
          notes,
          couponId: couponId || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Payment verification failed");
      }

      const result = await response.json();
      razorpayInstanceRef.current = null;
      clearLoadingTimeout();
      setPaymentError(null);
      onSuccess(result.orderId);
      toast.success("Payment successful! Order placed.");
    } catch (error) {
      resetLoading();
      const msg =
        error instanceof Error
          ? error.message
          : "Payment verification failed. Please contact support.";
      setPaymentError(msg);
      onError(msg);
    }
  };

  const displayAmount = confirmedAmount ?? amount;
  const amountMismatch =
    confirmedAmount !== null && Math.abs(confirmedAmount - amount) > 0.5;

  return (
    <div className="space-y-3">
      {/* Amount mismatch warning */}
      {amountMismatch && (
        <div className="flex items-start gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-gray-500" />
          <span>
            The confirmed amount ({formatPrice(confirmedAmount!)}) differs from
            the displayed total. The server amount will be charged.
          </span>
        </div>
      )}

      {/* Payment failure banner */}
      {paymentError && (
        <div className="flex items-start gap-2.5 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-gray-500" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900">Payment failed</p>
            <p className="text-xs text-gray-600 mt-0.5">{paymentError}</p>
            {failureCount >= 2 && (
              <p className="text-xs text-gray-500 mt-1">
                Having trouble? Try a different payment method or{" "}
                <a href="/my/help" className="underline font-medium">
                  contact support
                </a>
                .
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setPaymentError(null)}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0 text-sm leading-none"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* Pay button */}
      <Button
        onClick={handlePayment}
        disabled={disabled || isLoading}
        className="w-full h-10"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing…
          </>
        ) : paymentError ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again · {formatPrice(displayAmount)}
          </>
        ) : displayAmount > 0 ? (
          `Pay ${formatPrice(displayAmount)}`
        ) : (
          "Place Order"
        )}
      </Button>

      {/* Security note */}
      {!disabled && !paymentError && (
        <p className="text-xs text-center text-gray-400 flex items-center justify-center gap-1">
          <ShieldCheck className="h-3 w-3" />
          Secured by Razorpay · 256-bit SSL encryption
        </p>
      )}
    </div>
  );
}
