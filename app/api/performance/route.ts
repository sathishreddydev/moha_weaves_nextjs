import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth/config/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const performanceData = await request.json();
    
    // Log performance metrics
    console.log('Performance metrics:', {
      userId: session.user.id,
      timestamp: new Date().toISOString(),
      metrics: performanceData,
    });

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to monitoring service
      // await sendPerformanceMetrics(performanceData);
    }

    return NextResponse.json({
      success: true,
      message: 'Performance metrics logged successfully',
    });

  } catch (error) {
    console.error('Performance logging failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to log performance metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Return basic performance stats
    const stats = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });

  } catch (error) {
    console.error('Performance stats failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get performance stats',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
