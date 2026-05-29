import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

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

    console.log('2factor.in send response:', JSON.stringify(data));

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
