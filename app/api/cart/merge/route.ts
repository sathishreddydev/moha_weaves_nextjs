import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth/config/auth';
import { cartServices } from '@/app/api/cart/cartService';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;

    // Get guest cart from request body
    const { guestCartItems } = await request.json();

    // Handle case where guest cart might be empty or invalid
    if (!guestCartItems) {
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

    // Merge each guest cart item into the user's server-side cart
    let mergedCount = 0;
    for (const guestItem of guestCartItems) {
      if (!guestItem.productId) continue;

      try {
        await cartServices.addToCart({
          userId,
          productId: guestItem.productId,
          quantity: guestItem.quantity || 1,
          variantId: guestItem.variantId || null,
        });
        mergedCount++;
      } catch (error: any) {
        // Skip items that fail (e.g., out of stock) — don't block the whole merge
        console.warn(`Failed to merge item ${guestItem.productId}:`, error.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Cart merged successfully',
      mergedItems: mergedCount,
    });
  } catch (error) {
    console.error('Cart merge error:', error);
    return NextResponse.json(
      { error: 'Failed to merge cart' },
      { status: 500 }
    );
  }
}
