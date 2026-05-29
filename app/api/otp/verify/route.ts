import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { users } from '@/shared';
import { eq } from 'drizzle-orm';
import { RateLimitService } from '@/auth/server';

const verifyOtpSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  sessionId: z.string().min(1, 'Session ID is required'),
});

const TWO_FACTOR_API_KEY = process.env.TWO_FACTOR_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = verifyOtpSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { phone, otp, sessionId } = validation.data;

    // Rate limit: max 5 verify attempts per phone per 10 minutes
    const rateLimit = await RateLimitService.checkRateLimit(
      `otp-verify:${phone}`,
      5,
      10 * 60 * 1000
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many attempts. Please request a new OTP.' },
        { status: 429 }
      );
    }

    if (!TWO_FACTOR_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'OTP service not configured' },
        { status: 500 }
      );
    }

    // Verify OTP via 2factor.in API
    const response = await fetch(
      `https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/SMS/VERIFY/${sessionId}/${otp}`,
      { method: 'GET' }
    );

    const data = await response.json();

    // 2factor.in returns Status: "Success" and Details: "OTP Matched" on success
    if (data.Status !== 'Success') {
      return NextResponse.json(
        { success: false, error: data.Details || 'Invalid OTP. Please try again.' },
        { status: 400 }
      );
    }

    // OTP verified — clear rate limit for this phone
    RateLimitService.clearRateLimit(`otp-verify:${phone}`);

    // Find or create user by phone
    let [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1);

    let isNewUser = false;

    if (!existingUser) {
      // Create a new user with phone number only (Myntra-style)
      const [newUser] = await db
        .insert(users)
        .values({
          name: `User`,
          phone,
          role: 'user',
          isActive: true,
          createdAt: new Date(),
        })
        .returning();

      existingUser = newUser;
      isNewUser = true;
    }

    // Return user info for NextAuth signIn on the client
    return NextResponse.json({
      success: true,
      verified: true,
      isNewUser,
      user: {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        phone: existingUser.phone,
        role: existingUser.role,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { success: false, error: 'OTP verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
