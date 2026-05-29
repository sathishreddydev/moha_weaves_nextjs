"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/auth";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loginWithOtp } = useAuth();

  const [step, setStep] = useState<"main" | "otp">("main");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [sessionId, setSessionId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const returnUrl =
    searchParams.get("returnUrl") || searchParams.get("redirect") || "/";

  useEffect(() => {
    if (isAuthenticated) {
      router.push(returnUrl);
    }
  }, [isAuthenticated, router, returnUrl]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: returnUrl });
  };

  const handleSendOtp = async () => {
    const cleaned = phone.replace(/\s/g, "");
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleaned }),
      });
      const data = await res.json();
      if (data.success) {
        setSessionId(data.sessionId);
        setStep("otp");
        setResendTimer(30);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        setError(data.error || "Failed to send OTP");
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (index + i < 6) newOtp[index + i] = d;
      });
      setOtp(newOtp);
      otpRefs.current[Math.min(index + digits.length, 5)]?.focus();
      return;
    }
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError("Enter the 6-digit code");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.replace(/\s/g, ""), otp: otpValue, sessionId }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Invalid code");
        return;
      }
      const result = await loginWithOtp(phone.replace(/\s/g, ""), data.user.id);
      if (!result.success) {
        setError(result.error || "Login failed");
      } else {
        router.push(returnUrl);
      }
    } catch {
      setError("Verification failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.replace(/\s/g, "") }),
      });
      const data = await res.json();
      if (data.success) {
        setSessionId(data.sessionId);
        setResendTimer(30);
        setOtp(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
      } else {
        setError(data.error || "Failed to resend");
      }
    } catch {
      setError("Failed to resend");
    } finally {
      setLoading(false);
    }
  };

  const loginContent = (
    <>
      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-2.5 rounded-xl text-sm mb-5">
          {error}
        </div>
      )}

      {step === "main" ? (
        <div className="space-y-5">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full h-12 flex items-center justify-center gap-3 border border-gray-200 rounded-full text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </button>

          <div className="text-center text-sm text-gray-400">or</div>

          <div className="flex items-center bg-gray-100 rounded-full px-4 h-12">
            <span className="text-sm text-gray-500 font-medium mr-2">+91</span>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="Phone number"
              maxLength={10}
              value={phone}
              onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "")); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter" && phone.length === 10) handleSendOtp(); }}
              disabled={loading}
              className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
            />
          </div>

          <button
            type="button"
            onClick={handleSendOtp}
            disabled={loading || phone.length < 10}
            className="w-full h-12 bg-black text-white rounded-full text-sm font-semibold hover:bg-gray-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>

          <p className="text-center text-xs text-gray-400 pt-2">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="underline">Terms</Link> &{" "}
            <Link href="/privacy" className="underline">Privacy Policy</Link>
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-sm text-gray-500 text-center">
            Code sent to <span className="font-semibold text-gray-800">+91 {phone}</span>
          </p>

          <div className="flex justify-center gap-2.5">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { otpRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                disabled={loading}
                className="w-11 h-12 text-center text-lg font-bold bg-gray-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all disabled:opacity-50"
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleVerify}
            disabled={loading || otp.join("").length !== 6}
            className="w-full h-12 bg-black text-white rounded-full text-sm font-semibold hover:bg-gray-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying..." : "Verify & Sign in"}
          </button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => { setStep("main"); setOtp(["", "", "", "", "", ""]); setError(""); }}
              className="text-gray-500 hover:text-gray-800"
            >
              Change number
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendTimer > 0 || loading}
              className={resendTimer > 0 ? "text-gray-400" : "text-black font-medium underline"}
            >
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend code"}
            </button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile: Full screen, no gaps */}
      <div className="lg:hidden min-h-screen flex flex-col">
        <div className="relative h-44 bg-gradient-to-br from-orange-400 via-rose-400 to-purple-500 flex items-center justify-center overflow-hidden shrink-0">
          <div className="absolute -left-6 -bottom-6 w-24 h-24 rounded-full bg-yellow-300/40" />
          <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-green-400/40" />
          <div className="absolute right-8 top-4 w-10 h-10 rounded-full bg-teal-300/30" />
          <h1 className="z-10 text-center px-4">
            <span className="text-base font-medium text-white/90 block">Login to your</span>
            <span className="text-2xl font-bold text-white block mt-1">Moha Weaves</span>
            <span className="text-base font-medium text-white/90 block mt-1">Account</span>
          </h1>
        </div>

        <div className="flex-1 bg-white rounded-t-3xl -mt-6 relative z-10 px-6 py-8">
          {loginContent}
        </div>
      </div>

      {/* Desktop: Split layout - image left, login right */}
      <div className="hidden lg:flex min-h-screen">
        <div className="w-1/2 relative bg-gradient-to-br from-orange-400 via-rose-400 to-purple-500 overflow-hidden">
          <div className="absolute -left-20 -bottom-20 w-72 h-72 rounded-full bg-yellow-300/30" />
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-green-400/20" />
          <div className="absolute right-20 bottom-20 w-40 h-40 rounded-full bg-teal-300/20" />
          <div className="absolute left-16 top-16 w-28 h-28 rounded-full bg-pink-300/30" />
          <div className="flex items-center justify-center h-full relative z-10">
            <div className="text-center text-white">
              <h1 className="text-5xl font-bold mb-4">Moha Weaves</h1>
              <p className="text-lg text-white/80">Handcrafted with love</p>
            </div>
          </div>
        </div>

        <div className="w-1/2 flex items-center justify-center bg-white">
          <div className="w-full max-w-[380px] px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Login to your Moha Weaves Account
            </h2>
            {loginContent}
          </div>
        </div>
      </div>
    </>
  );
}
