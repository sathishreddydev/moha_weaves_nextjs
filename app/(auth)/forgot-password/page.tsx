"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Steps: "email" → "phone" (if needed) → "otp" → "new-password"
  const [step, setStep] = useState<"email" | "phone" | "otp" | "new-password">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [sessionId, setSessionId] = useState("");
  const [userId, setUserId] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [newPhone, setNewPhone] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  // Step 1: Submit email
  const handleEmailSubmit = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        setSessionId(data.sessionId);
        setUserId(data.userId);
        setMaskedPhone(data.maskedPhone);
        setNewPhone(data.newPhone || null);
        setStep("otp");
        setResendTimer(30);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else if (data.needsPhone) {
        // Account has no phone — ask user to provide one
        setUserId(data.userId || "");
        setStep("phone");
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit phone (if account has no phone)
  const handlePhoneSubmit = async () => {
    const cleaned = phone.replace(/\s/g, "");
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), phone: cleaned }),
      });
      const data = await res.json();

      if (data.success) {
        setSessionId(data.sessionId);
        setUserId(data.userId);
        setMaskedPhone(data.maskedPhone);
        setNewPhone(data.newPhone || null);
        setStep("otp");
        setResendTimer(30);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // OTP input handlers
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

  // Step 3: Verify OTP → go to new password
  const handleVerifyOtp = async () => {
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError("Enter the 6-digit code");
      return;
    }
    setError("");
    setStep("new-password");
  };

  // Step 4: Set new password
  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          sessionId,
          otp: otp.join(""),
          newPassword,
          newPhone,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess("Password reset successfully! Redirecting to login...");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setError(data.error || "Failed to reset password");
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError("");
    setLoading(true);

    try {
      const body: any = { email: email.trim() };
      if (newPhone) body.phone = newPhone;

      const res = await fetch("/api/auth/forgot-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Moha Weaves</h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === "email" && "Reset your password"}
            {step === "phone" && "Enter your phone number for verification"}
            {step === "otp" && "Enter verification code"}
            {step === "new-password" && "Set your new password"}
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm mb-4">
            {success}
          </div>
        )}

        {/* Step 1: Email */}
        {step === "email" && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Email address
              </label>
              <Input
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleEmailSubmit(); }}
                disabled={loading}
                autoFocus
              />
            </div>

            <Button
              onClick={handleEmailSubmit}
              disabled={loading || !email.trim()}
              className="w-full h-11"
            >
              {loading ? "Finding account..." : "Continue"}
            </Button>

            <div className="text-center mt-3">
              <Link
                href="/login"
                className="text-sm text-gray-500 hover:text-gray-800 underline transition-colors"
              >
                ← Back to login
              </Link>
            </div>
          </div>
        )}

        {/* Step 2: Phone (if account has no phone) */}
        {step === "phone" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              No phone number is linked to your account. Enter a phone number to receive the verification code.
            </p>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Phone number
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  +91
                </span>
                <Input
                  type="tel"
                  inputMode="numeric"
                  placeholder="Enter mobile number"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "")); setError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handlePhoneSubmit(); }}
                  disabled={loading}
                  className="rounded-l-none"
                  autoFocus
                />
              </div>
            </div>

            <Button
              onClick={handlePhoneSubmit}
              disabled={loading || phone.length < 10}
              className="w-full h-11"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </Button>

            <div className="text-center mt-3">
              <button
                type="button"
                onClick={() => { setStep("email"); setError(""); }}
                className="text-sm text-gray-500 hover:text-gray-800 underline transition-colors"
              >
                ← Change email
              </button>
            </div>
          </div>
        )}

        {/* Step 3: OTP */}
        {step === "otp" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              We sent a code to{" "}
              <span className="font-semibold text-gray-900">{maskedPhone}</span>
            </p>

            <div className="flex justify-center gap-2.5 my-6">
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
                  className="w-11 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                />
              ))}
            </div>

            <Button
              onClick={handleVerifyOtp}
              disabled={loading || otp.join("").length !== 6}
              className="w-full h-11"
            >
              Verify
            </Button>

            <div className="flex items-center justify-between text-sm pt-2">
              <button
                type="button"
                onClick={() => { setStep("email"); setOtp(["", "", "", "", "", ""]); setError(""); }}
                className="text-gray-500 hover:text-gray-800 transition-colors"
              >
                ← Start over
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendTimer > 0 || loading}
                className={`transition-colors ${
                  resendTimer > 0 ? "text-gray-400" : "text-black font-medium hover:underline"
                }`}
              >
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend code"}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: New Password */}
        {step === "new-password" && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                New password
              </label>
              <Input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                disabled={loading}
                autoFocus
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Confirm password
              </label>
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleResetPassword(); }}
                disabled={loading}
              />
            </div>

            <Button
              onClick={handleResetPassword}
              disabled={loading || !newPassword || !confirmPassword}
              className="w-full h-11"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
