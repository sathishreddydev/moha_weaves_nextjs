import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/shared/tables';
import { sql } from 'drizzle-orm';

export async function GET() {
  const checks: Record<string, any> = {};

  // Check env vars
  checks.NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'NOT SET';
  checks.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET ? 'SET (' + process.env.NEXTAUTH_SECRET.length + ' chars)' : 'NOT SET';
  checks.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET';
  checks.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET';
  checks.TWO_FACTOR_API_KEY = process.env.TWO_FACTOR_API_KEY ? 'SET' : 'NOT SET';
  checks.DATABASE_URL = process.env.DATABASE_URL ? 'SET' : 'NOT SET';

  // Check DB connection
  try {
    const result = await db.select({ count: sql<number>`count(*)` }).from(users);
    checks.dbConnection = 'OK';
    checks.userCount = result[0]?.count;
  } catch (error: any) {
    checks.dbConnection = 'FAILED: ' + error?.message;
  }

  return NextResponse.json(checks);
}
