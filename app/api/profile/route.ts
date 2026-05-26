import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth/config/auth';
import { db } from '@/lib/db';
import { users } from '@/shared/tables';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// GET - fetch current user profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - update user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Get current user to check what's already set
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build update object — only allow updating fields that are not already set
    const updateData: Record<string, any> = {};

    // Name can always be updated
    if (body.name && body.name.trim().length >= 1) {
      updateData.name = body.name.trim();
    }

    // Email: only allow if not already set
    if (body.email) {
      if (currentUser.email) {
        return NextResponse.json(
          { error: 'Email is already set and cannot be changed' },
          { status: 400 }
        );
      }
      // Validate email format
      const emailValidation = z.string().email().safeParse(body.email);
      if (!emailValidation.success) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      }
      // Check if email is already taken by another user
      const [existingEmail] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, body.email))
        .limit(1);
      if (existingEmail) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
      }
      updateData.email = body.email;
    }

    // Phone: only allow if not already set
    if (body.phone) {
      if (currentUser.phone) {
        return NextResponse.json(
          { error: 'Phone number is already set and cannot be changed' },
          { status: 400 }
        );
      }
      const phoneValidation = z.string().regex(/^[6-9]\d{9}$/).safeParse(body.phone);
      if (!phoneValidation.success) {
        return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
      }
      // Check if phone is already taken
      const [existingPhone] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.phone, body.phone))
        .limit(1);
      if (existingPhone) {
        return NextResponse.json({ error: 'Phone number already in use' }, { status: 400 });
      }
      updateData.phone = body.phone;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, session.user.id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
      });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
