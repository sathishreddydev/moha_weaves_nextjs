import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/shared';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Validation schema
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
});

// Helper function to create user
async function createUser(insertUser: any): Promise<any> {
  const [user] = await db.insert(users).values(insertUser).returning();
  return user;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: validation.error.errors.map(err => err.message)
        },
        { status: 400 }
      );
    }

    const { email, password, name, phone } = validation.data;

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create new user
    const user = await createUser({
      email,
      password: hashedPassword,
      name,
      phone: phone || null,
      role: 'user',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Return user without password
    const { password: _, ...safeUser } = user;
    
    return NextResponse.json({
      success: true,
      data: {
        user: safeUser,
        message: 'Registration successful'
      }
    });
  } catch (error) {
    console.error('Registration API Error:', error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        return NextResponse.json(
          { success: false, error: 'Email already registered' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
