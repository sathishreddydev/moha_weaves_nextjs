import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { users } from '@/shared/tables';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const schema = z.object({
  userId: z.string().min(1),
  sessionId: z.string().min(1),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  newPhone: z.string().regex(/^[6-9]\d{9}$/).optional().nullable(),
});

const TWO_FACTOR_API_KEY = process.env.TWO_FACTOR_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = schema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { userId, sessionId, otp, newPassword, newPhone } = validation.data;

    if (!TWO_FACTOR_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'OTP service not configured' },
        { status: 500 }
      );
    }

    // Verify OTP via 2factor.in
    const response = await fetch(
      `https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/SMS/VERIFY/${sessionId}/${otp}`,
      { method: 'GET' }
    );

    const data = await response.json();
    console.log('2factor.in forgot-password verify:', JSON.stringify(data));

    if (data.Status !== 'Success') {
      return NextResponse.json(
        { success: false, error: data.Details || 'Invalid OTP. Please try again.' },
        { status: 400 }
      );
    }

    // OTP verified — reset password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const updateData: Record<string, any> = {
      password: hashedPassword,
    };

    // If user provided a new phone (account had no phone), link it
    if (newPhone) {
      updateData.phone = newPhone;
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Try again.' },
      { status: 500 }
    );
  }
}
