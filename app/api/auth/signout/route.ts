import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth/server';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Clear session cookie
    const response = NextResponse.json({ success: true });
    
    // Clear NextAuth session cookie
    response.cookies.set('next-auth.session-token', '', {
      expires: new Date(0),
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
