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
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
});

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

    // Check if email already exists
    const [existingEmailUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingEmailUser) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // If phone is provided, check if an OTP-created account exists with that phone
    // If yes, link email/password to that existing account instead of creating a new one
    if (phone) {
      const [existingPhoneUser] = await db
        .select()
        .from(users)
        .where(eq(users.phone, phone))
        .limit(1);

      if (existingPhoneUser) {
        // Phone account exists — check if it already has an email
        if (existingPhoneUser.email) {
          return NextResponse.json(
            { success: false, error: 'Phone number already linked to another account' },
            { status: 400 }
          );
        }

        // OTP-only account — link email and password to it
        const [updatedUser] = await db
          .update(users)
          .set({
            email,
            password: hashedPassword,
            name, // update name too
          })
          .where(eq(users.id, existingPhoneUser.id))
          .returning();

        const { password: _, ...safeUser } = updatedUser;

        return NextResponse.json({
          success: true,
          data: {
            user: safeUser,
            message: 'Account linked successfully. You can now login with email or OTP.',
          }
        });
      }
    }

    // No existing phone account — create new user
    const [user] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        name,
        phone: phone || null,
        role: 'user',
        isActive: true,
        createdAt: new Date(),
      })
      .returning();

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
    
    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        return NextResponse.json(
          { success: false, error: 'Email or phone already registered' },
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
