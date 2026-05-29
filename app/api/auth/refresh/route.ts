import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '../../../../auth/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth/config/auth';

export async function POST(request: NextRequest) {
  try {
    const { refreshToken, userId } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Try to get userId from session, request body, or fail
    let tokenUserId = userId;
    if (!tokenUserId) {
      const session = await getServerSession(authOptions);
      tokenUserId = session?.user?.id;
    }

    if (!tokenUserId) {
      return NextResponse.json(
        { error: 'User identification required' },
        { status: 401 }
      );
    }

    // Validate refresh token for this specific user
    const user = await AuthService.validateRefreshToken(refreshToken, tokenUserId);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // Revoke old refresh token (token rotation)
    await AuthService.revokeRefreshToken(refreshToken, user.id);

    // Create new tokens
    const tokens = await AuthService.createSessionTokens(user);

    return NextResponse.json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: tokens.user
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
