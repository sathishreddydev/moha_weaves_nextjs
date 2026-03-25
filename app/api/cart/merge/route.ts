import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth/config/auth';
import { mergeGuestCartToUser } from '@/lib/cart';
import { User } from '@/shared';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get guest cart from request body
    const { guestCartItems } = await request.json();

    // Handle case where guest cart might be empty or invalid
    if (!guestCartItems) {
      // No guest cart to merge - just return success
      return NextResponse.json({
        success: true,
        message: 'No guest cart to merge',
        mergedItems: 0,
      });
    }

    if (!Array.isArray(guestCartItems)) {
      return NextResponse.json(
        { error: 'Invalid guest cart data format' },
        { status: 400 }
      );
    }

    // Merge guest cart with user cart using the provided guest cart items
    await mergeGuestCartToUser(session.user as User, guestCartItems);

    return NextResponse.json({
      success: true,
      message: 'Cart merged successfully',
      mergedItems: guestCartItems.length,
    });
  } catch (error) {
    console.error('Cart merge error:', error);
    return NextResponse.json(
      { error: 'Failed to merge cart' },
      { status: 500 }
    );
  }
}
