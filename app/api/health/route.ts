import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth/config/auth';
import { users } from '@/shared/tables';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Test database connection
    const db = await import('@/lib/db').then(m => m.db);
    await db.select().from(users).limit(1);

    // Test database connection pooling
    const poolInfo = {
      connected: true,
      timestamp: new Date().toISOString(),
      user: session.user.email,
      sessionId: session.user.id,
    };

    return NextResponse.json({
      success: true,
      message: 'Health check passed',
      data: poolInfo,
    });

  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
