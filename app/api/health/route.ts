import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/shared/tables';

// Health endpoint is intentionally PUBLIC — no auth required.
// Docker Compose, nginx, and deploy scripts need to poll this without credentials.
// It must NEVER return sensitive info (session data, DB usernames, etc.).
export async function GET() {
  try {
    // Lightweight DB connectivity check
    await db.select({ id: users.id }).from(users).limit(1);

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check failed:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { status: 'error', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
