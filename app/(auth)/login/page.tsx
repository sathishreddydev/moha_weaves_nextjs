"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/auth";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Email/Password schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Phone schema
const phoneSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian phone number"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type PhoneFormData = z.infer<typeof phoneSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, login, loginWithOtp } = useAuth();
  const [serverError, setServerError] = useState("");

  // OTP state
  const [otpStep, setOtpStep] = useState<"phone" | "otp">("phone");
  const [otpSessionId, setOtpSessionId] = useState("");
  const [otpPhone, setOtpPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const returnUrl =
    searchParams.get("returnUrl") || searchParams.get("redirect") || "/";

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push(returnUrl);
    }
  }, [isAuthenticated, router, returnUrl]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Email/Password form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Phone form
  const {
    register: registerPhone,
    handleSubmit: handlePhoneSubmit,
    formState: { errors: phoneErrors, isSubmitting: phoneSubmitting },
  } = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError("");
    const result = await login(data.email, data.password);
    if (!result.success) {
      setServerError(result.error || "Invalid email or password");
    } else {
      router.push(returnUrl);
    }
  };

  // Send OTP
  const onSendOtp = async (data: PhoneFormData) => {
    setOtpError("");
    setOtpLoading(true);

    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: data.phone }),
      });

      const result = await response.json();

      if (result.success) {
        setOtpSessionId(result.sessionId);
        setOtpPhone(data.phone);
        setOtpStep("otp");
        setResendTimer(30);
        // Focus first OTP input
        setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
      } else {
        setOtpError(result.error || "Failed to send OTP");
      }
    } catch {
      setOtpError("Failed to send OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (index + i < 6) newOtp[index + i] = digit;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP backspace
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP
  const onVerifyOtp = async () => {
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setOtpError("Please enter the complete 6-digit OTP");
      return;
    }

    setOtpError("");
    setOtpLoading(true);

    try {
      // Step 1: Verify OTP with 2factor.in
      const verifyResponse = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: otpPhone,
          otp: otpValue,
          sessionId: otpSessionId,
        }),
      });

      const verifyResult = await verifyResponse.json();

      if (!verifyResult.success) {
        setOtpError(verifyResult.error || "Invalid OTP");
        return;
      }

      // Step 2: Sign in via NextAuth with the verified user
      const result = await loginWithOtp(otpPhone, verifyResult.user.id);

      if (!result.success) {
        setOtpError(result.error || "Login failed");
      } else {
        router.push(returnUrl);
      }
    } catch {
      setOtpError("Verification failed. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Resend OTP
  const onResendOtp = async () => {
    if (resendTimer > 0) return;

    setOtpError("");
    setOtpLoading(true);

    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: otpPhone }),
      });

      const result = await response.json();

      if (result.success) {
        setOtpSessionId(result.sessionId);
        setResendTimer(30);
        setOtp(["", "", "", "", "", ""]);
        otpInputRefs.current[0]?.focus();
      } else {
        setOtpError(result.error || "Failed to resend OTP");
      }
    } catch {
      setOtpError("Failed to resend OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            Sign in to your account
          </CardTitle>
          <CardDescription className="text-center">
            Or{" "}
            <Link
              href="/register"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              create a new account
            </Link>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="otp">OTP</TabsTrigger>
            </TabsList>

            {/* Email/Password Tab */}
            <TabsContent value="email">
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4"
                noValidate
              >
                {serverError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                    {serverError}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    {...register("email")}
                    disabled={isSubmitting}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    {...register("password")}
                    disabled={isSubmitting}
                    className={errors.password ? "border-red-500" : ""}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-600">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            {/* OTP Tab */}
            <TabsContent value="otp">
              {otpStep === "phone" ? (
                <form
                  onSubmit={handlePhoneSubmit(onSendOtp)}
                  className="space-y-4"
                  noValidate
                >
                  {otpError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                      {otpError}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="flex gap-2">
                      <div className="flex items-center px-3 bg-gray-100 border rounded-md text-sm text-gray-600">
                        +91
                      </div>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter 10-digit number"
                        maxLength={10}
                        {...registerPhone("phone")}
                        disabled={otpLoading}
                        className={phoneErrors.phone ? "border-red-500" : ""}
                      />
                    </div>
                    {phoneErrors.phone && (
                      <p className="text-sm text-red-600">
                        {phoneErrors.phone.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={otpLoading || phoneSubmitting}
                    className="w-full"
                  >
                    {otpLoading ? "Sending OTP..." : "Send OTP"}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  {otpError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                      {otpError}
                    </div>
                  )}

                  <p className="text-sm text-gray-600 text-center">
                    OTP sent to{" "}
                    <span className="font-medium">+91 {otpPhone}</span>
                  </p>

                  {/* OTP Input Boxes */}
                  <div className="flex justify-center gap-2">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { otpInputRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) =>
                          handleOtpChange(index, e.target.value)
                        }
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-10 h-12 text-center text-lg font-semibold border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        disabled={otpLoading}
                      />
                    ))}
                  </div>

                  <Button
                    onClick={onVerifyOtp}
                    disabled={otpLoading || otp.join("").length !== 6}
                    className="w-full"
                  >
                    {otpLoading ? "Verifying..." : "Verify & Sign in"}
                  </Button>

                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpStep("phone");
                        setOtp(["", "", "", "", "", ""]);
                        setOtpError("");
                      }}
                      className="text-primary-600 hover:underline"
                    >
                      Change number
                    </button>
                    <button
                      type="button"
                      onClick={onResendOtp}
                      disabled={resendTimer > 0 || otpLoading}
                      className={`${
                        resendTimer > 0
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-primary-600 hover:underline"
                      }`}
                    >
                      {resendTimer > 0
                        ? `Resend in ${resendTimer}s`
                        : "Resend OTP"}
                    </button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
