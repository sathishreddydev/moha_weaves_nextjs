"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/auth";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Phone, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type EmailFormData = z.infer<typeof emailSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, login, loginWithOtp } = useAuth();

  const [mode, setMode] = useState<"phone" | "email">("email");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [sessionId, setSessionId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
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

  // Email form
  const {
    register,
    handleSubmit,
    formState: { errors: emailErrors, isSubmitting },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const onEmailSubmit = async (data: EmailFormData) => {
    setError("");
    const result = await login(data.email, data.password);
    if (!result.success) {
      setError(result.error || "Invalid email or password");
    } else {
      router.push(returnUrl);
    }
  };

  // Send OTP
  const handleSendOtp = async () => {
    const cleaned = phone.replace(/\s/g, "");
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/send", {
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

  // OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (index + i < 6) newOtp[index + i] = d;
      });
      setOtp(newOtp);
      const next = Math.min(index + digits.length, 5);
      otpRefs.current[next]?.focus();
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

  // Verify OTP
  const handleVerify = async () => {
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError("Enter the 6-digit code");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.replace(/\s/g, ""),
          otp: otpValue,
          sessionId,
        }),
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

  // Resend
  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/send", {
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

  // Switch mode
  const switchMode = () => {
    setMode(mode === "phone" ? "email" : "phone");
    setError("");
    setStep("phone");
    setOtp(["", "", "", "", "", ""]);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[400px]">
        {/* Brand */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Welcome back
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            {mode === "phone"
              ? step === "phone"
                ? "Enter your phone number to continue"
                : "Enter the code we sent you"
              : "Sign in to your account"}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm mb-5 animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}

        {mode === "email" ? (
          /* ─── Email Login ─── */
          <div>
            <form
              onSubmit={handleSubmit(onEmailSubmit)}
              className="space-y-5"
              noValidate
            >
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  {...register("email")}
                  disabled={isSubmitting}
                  className={`h-11 ${emailErrors.email ? "border-red-400 focus:ring-red-200" : ""}`}
                  autoFocus
                />
                {emailErrors.email && (
                  <p className="text-xs text-red-500 mt-1.5">
                    {emailErrors.email.message}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("password")}
                    disabled={isSubmitting}
                    className={`h-11 pr-10 ${emailErrors.password ? "border-red-400 focus:ring-red-200" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {emailErrors.password && (
                  <p className="text-xs text-red-500 mt-1.5">
                    {emailErrors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 text-sm font-semibold"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-gray-400 uppercase tracking-wide">
                  or
                </span>
              </div>
            </div>

            {/* OTP Login Button */}
            <button
              type="button"
              onClick={switchMode}
              className="w-full h-11 flex items-center justify-center gap-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              <Phone size={16} />
              Continue with Phone OTP
            </button>

            {/* Create account */}
            <p className="text-center text-sm text-gray-500 mt-6">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-gray-900 hover:underline"
              >
                Create one
              </Link>
            </p>
          </div>
        ) : (
          /* ─── Phone OTP Login ─── */
          <>
            {step === "phone" ? (
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Phone number
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3.5 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm font-medium">
                      +91
                    </span>
                    <Input
                      type="tel"
                      inputMode="numeric"
                      placeholder="Enter 10-digit number"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value.replace(/\D/g, ""));
                        setError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSendOtp();
                      }}
                      disabled={loading}
                      className="rounded-l-none h-11"
                      autoFocus
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSendOtp}
                  disabled={loading || phone.length < 10}
                  className="w-full h-11 text-sm font-semibold"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    "Send OTP"
                  )}
                </Button>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-gray-400 uppercase tracking-wide">
                      or
                    </span>
                  </div>
                </div>

                {/* Email Login Button */}
                <button
                  type="button"
                  onClick={switchMode}
                  className="w-full h-11 flex items-center justify-center gap-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  <Mail size={16} />
                  Continue with Email
                </button>

                <p className="text-xs text-center text-gray-400 mt-4">
                  By continuing, you agree to our{" "}
                  <Link href="/terms" className="underline hover:text-gray-600">
                    Terms
                  </Link>{" "}
                  &{" "}
                  <Link href="/privacy" className="underline hover:text-gray-600">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            ) : (
              /* OTP Verification */
              <div className="space-y-5">
                <div className="text-center">
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone size={24} className="text-gray-600" />
                  </div>
                  <p className="text-sm text-gray-600">
                    Code sent to{" "}
                    <span className="font-semibold text-gray-900">
                      +91 {phone}
                    </span>
                  </p>
                </div>

                {/* OTP Boxes */}
                <div className="flex justify-center gap-2.5 py-2">
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
                      className="w-11 h-13 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all disabled:opacity-50"
                    />
                  ))}
                </div>

                <Button
                  onClick={handleVerify}
                  disabled={loading || otp.join("").length !== 6}
                  className="w-full h-11 text-sm font-semibold"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    "Verify & Sign in"
                  )}
                </Button>

                <div className="flex items-center justify-between text-sm pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("phone");
                      setOtp(["", "", "", "", "", ""]);
                      setError("");
                    }}
                    className="text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    ← Change
                  </button>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendTimer > 0 || loading}
                    className={`transition-colors ${
                      resendTimer > 0
                        ? "text-gray-400"
                        : "text-gray-900 font-medium hover:underline"
                    }`}
                  >
                    {resendTimer > 0
                      ? `Resend in ${resendTimer}s`
                      : "Resend code"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
