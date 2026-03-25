import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json();
    
    // Log error to console (in production, this would go to a monitoring service)
    console.error('Client-side error:', {
      message: errorData.error,
      stack: errorData.stack,
      componentStack: errorData.componentStack,
      timestamp: errorData.timestamp,
      userAgent: errorData.userAgent,
      url: errorData.url,
    });

    // In production, send to monitoring service like Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to monitoring service
      // await sendToMonitoringService(errorData);
    }

    return NextResponse.json({
      success: true,
      message: 'Error logged successfully',
    });

  } catch (error) {
    console.error('Error logging failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to log error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
