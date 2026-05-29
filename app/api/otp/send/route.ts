import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RateLimitService } from '@/auth/server';

const sendOtpSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
});

const TWO_FACTOR_API_KEY = process.env.TWO_FACTOR_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = sendOtpSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { phone } = validation.data;

    // Rate limit: max 3 OTP sends per phone per 10 minutes
    const rateLimit = await RateLimitService.checkRateLimit(
      `otp-send:${phone}`,
      3,
      10 * 60 * 1000
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many OTP requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Also rate limit by IP to prevent abuse across different numbers
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const ipRateLimit = await RateLimitService.checkRateLimit(
      `otp-send-ip:${ip}`,
      10,
      15 * 60 * 1000
    );
    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    if (!TWO_FACTOR_API_KEY) {
      console.error('TWO_FACTOR_API_KEY not configured');
      return NextResponse.json(
        { success: false, error: 'OTP service not configured' },
        { status: 500 }
      );
    }

    // Send OTP via 2factor.in API (SMS only)
    const url = `https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/SMS/${phone}/AUTOGEN2`;
    const response = await fetch(url, { method: 'GET' });

    const data = await response.json();

    if (data.Status === 'Success') {
      return NextResponse.json({
        success: true,
        sessionId: data.Details, // Session ID to verify OTP later
        message: 'OTP sent successfully',
      });
    } else {
      return NextResponse.json(
        { success: false, error: data.Details || 'Failed to send OTP' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send OTP. Please try again.' },
      { status: 500 }
    );
  }
}
