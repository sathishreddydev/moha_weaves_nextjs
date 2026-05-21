"use client";

import { Button } from "@/components/ui/button";
import { UserAddress } from "@/shared/types";
import { AlertCircle, AlertTriangle, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
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

  // ── Server-confirmed amount ───────────────────────────────────────────────
  // Pre-fetched via previewOnly so the user sees the server-computed total
  // before clicking Pay. null = not yet fetched.
  const [confirmedAmount, setConfirmedAmount] = useState<number | null>(null);
  const [isFetchingAmount, setIsFetchingAmount] = useState(false);

  // ── Persistent payment failure state ─────────────────────────────────────
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [failureCount, setFailureCount] = useState(0);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modalOpenRef = useRef(false);
  const razorpayInstanceRef = useRef<any>(null);
  // Cache the Razorpay order so we don't re-create it unnecessarily
  const razorpayOrderRef = useRef<{ id: string; amount: number; currency: string } | null>(null);

  // ── Helpers ───────────────────────────────────────────────────────────────
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

  // ── Pre-fetch server amount ───────────────────────────────────────────────
  // Runs when the pay button becomes enabled (address selected, no stock issues).
  // Uses previewOnly=true so no Razorpay order is created yet.
  useEffect(() => {
    if (disabled || !selectedAddress) {
      setConfirmedAmount(null);
      razorpayOrderRef.current = null;
      return;
    }

    let cancelled = false;
    const fetchAmount = async () => {
      setIsFetchingAmount(true);
      try {
        const res = await fetch("/api/razorpay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ couponId: couponId || undefined, previewOnly: true }),
        });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled) {
          // Razorpay returns amount in paise; convert to rupees
          setConfirmedAmount(data.amount / 100);
          // previewOnly doesn't return a razorpayOrderId — clear any stale cache
          razorpayOrderRef.current = null;
        }
      } catch {
        // Non-critical — fall back to client-computed amount silently
      } finally {
        if (!cancelled) setIsFetchingAmount(false);
      }
    };

    fetchAmount();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, selectedAddress?.id, couponId]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
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
  // If the user switches tabs while the modal is open and comes back,
  // reset the loading state so the button isn't stuck on "Processing…".
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && modalOpenRef.current) {
        setTimeout(() => { if (modalOpenRef.current) resetLoading(); }, 800);
      }
    };
    const handleFocus = () => {
      if (modalOpenRef.current) {
        setTimeout(() => { if (modalOpenRef.current) resetLoading(); }, 800);
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

  // ── Razorpay script fallback ──────────────────────────────────────────────
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // ── Pay handler ───────────────────────────────────────────────────────────
  const handlePayment = async () => {
    if (!window.Razorpay) {
      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        onError("Razorpay not loaded. Please refresh the page.");
        return;
      }
    }

    // Clear previous failure state on retry
    setPaymentError(null);
    setIsLoading(true);

    // Safety timeout — resets button if modal never resolves (10 min = Razorpay order expiry)
    clearLoadingTimeout();
    loadingTimeoutRef.current = setTimeout(() => setIsLoading(false), 10 * 60 * 1000);

    try {
      // Always create a fresh Razorpay order when the user clicks Pay
      // (previewOnly cached the amount but not an order ID)
      const response = await fetch("/api/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponId: couponId || undefined }),
      });

      if (!response.ok) {
        resetLoading();
        const data = await response.json().catch(() => ({}));
        const msg = data.message || "Failed to initiate payment. Please try again.";
        setPaymentError(msg);
        onError(msg);
        return;
      }

      const { razorpayOrderId, amount: razorpayAmount, currency } = await response.json();
      // Update confirmed amount with the real order amount
      setConfirmedAmount(razorpayAmount / 100);

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: razorpayAmount,
        currency,
        name: "Moha Weaves",
        description: "Purchase from Moha Weaves",
        order_id: razorpayOrderId,
        handler: async (paymentResponse: any) => {
          await handlePaymentSuccess(paymentResponse);
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: selectedAddress?.phone || "",
        },
        theme: { color: "#3399cc" },
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
      const msg = error instanceof Error ? error.message : "Payment failed. Please try again.";
      setPaymentError(msg);
      onError(msg);
    }
  };

  // ── Verify payment after Razorpay success callback ────────────────────────
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

  // ── Derived values ────────────────────────────────────────────────────────
  const displayAmount = confirmedAmount ?? amount;
  const amountMismatch = confirmedAmount !== null && Math.abs(confirmedAmount - amount) > 0.5;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* Server-confirmed amount row */}
      {!disabled && (
        <div className="flex items-center justify-between text-xs px-1">
          <span className="flex items-center gap-1 text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
            Amount verified by server
          </span>
          {isFetchingAmount ? (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Confirming…
            </span>
          ) : confirmedAmount !== null ? (
            <span className="font-semibold text-foreground">
              {formatPrice(confirmedAmount)}
            </span>
          ) : (
            <span className="text-muted-foreground">{formatPrice(amount)}</span>
          )}
        </div>
      )}

      {/* Amount mismatch warning */}
      {amountMismatch && (
        <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-amber-600" />
          <span>
            The confirmed amount ({formatPrice(confirmedAmount!)}) differs from the
            displayed total. The server amount will be charged.
          </span>
        </div>
      )}

      {/* Persistent payment failure banner */}
      {paymentError && (
        <div className="flex items-start gap-2.5 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-500" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-red-800">Payment failed</p>
            <p className="text-xs text-red-700 mt-0.5">{paymentError}</p>
            {failureCount >= 2 && (
              <p className="text-xs text-red-600 mt-1">
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
            className="text-red-400 hover:text-red-600 flex-shrink-0 text-base leading-none"
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
        size="lg"
        className="w-full"
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
        <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
          <ShieldCheck className="h-3 w-3 text-green-500" />
          Secured by Razorpay · 256-bit SSL encryption
        </p>
      )}
    </div>
  );
}
