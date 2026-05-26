import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { users } from '@/shared/tables';
import { eq } from 'drizzle-orm';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number').optional(),
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

    const { email, phone } = validation.data;

    // Find user by email
    const [user] = await db
      .select({ id: users.id, phone: users.phone, password: users.password })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No account found with this email' },
        { status: 404 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { success: false, error: 'This account uses OTP login only. No password to reset.' },
        { status: 400 }
      );
    }

    // Determine which phone to send OTP to
    let targetPhone = user.phone;

    if (!targetPhone) {
      // Account has no phone — user must provide one
      if (!phone) {
        return NextResponse.json({
          success: false,
          needsPhone: true,
          error: 'No phone number linked to this account. Please provide a phone number.',
        }, { status: 400 });
      }

      // Check if the provided phone is already taken by another account
      const [existingPhoneUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.phone, phone))
        .limit(1);

      if (existingPhoneUser && existingPhoneUser.id !== user.id) {
        return NextResponse.json(
          { success: false, error: 'This phone number is linked to another account' },
          { status: 400 }
        );
      }

      targetPhone = phone;
    }

    if (!TWO_FACTOR_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'OTP service not configured' },
        { status: 500 }
      );
    }

    // Send OTP
    const response = await fetch(
      `https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/SMS/${targetPhone}/AUTOGEN2`,
      { method: 'GET' }
    );

    const data = await response.json();
    console.log('2factor.in forgot-password send:', JSON.stringify(data));

    if (data.Status === 'Success') {
      const maskedPhone = `******${targetPhone.slice(-4)}`;

      return NextResponse.json({
        success: true,
        sessionId: data.Details,
        maskedPhone,
        userId: user.id,
        // If user provided a new phone, pass it back so we can link it after verification
        newPhone: !user.phone ? targetPhone : null,
      });
    } else {
      return NextResponse.json(
        { success: false, error: data.Details || 'Failed to send OTP' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Forgot password send OTP error:', error);
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Try again.' },
      { status: 500 }
    );
  }
}
