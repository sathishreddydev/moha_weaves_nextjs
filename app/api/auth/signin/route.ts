import { NextRequest, NextResponse } from 'next/server';
import { AuthService, RateLimitService } from '../../../../auth/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password, role = 'user' } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Rate limiting check
    const rateLimit = await RateLimitService.checkRateLimit(`signin:${email}`);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Find user in database
    const user = await AuthService.findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await AuthService.verifyPassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is deactivated. Please contact support.' },
        { status: 403 }
      );
    }

    // Create session tokens
    const sessionData = await AuthService.createSessionTokens(user);

    return NextResponse.json({
      success: true,
      user: sessionData.user,
      accessToken: sessionData.accessToken,
      refreshToken: sessionData.refreshToken,
    });
  } catch (error) {
    console.error('Signin error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
