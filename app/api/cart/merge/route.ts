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
    const skippedItems: string[] = [];
    
    // Get current user cart to check for existing items
    const currentCart = await cartServices.getCartItems(userId);
    
    for (const guestItem of guestCartItems) {
      if (!guestItem.productId) continue;

      const guestVariantId = guestItem.variantId || null;
      
      // Check if this exact product+variant already exists in user's cart
      const existingItem = currentCart.cart.find(
        (item: any) => item.productId === guestItem.productId && 
          (item.variantId || null) === guestVariantId
      );
      
      // If guest item has no variant but the product exists in cart WITH a variant,
      // skip to avoid creating a duplicate null-variant row alongside a real variant row.
      // But if the existing item also has no variant, let addToCart handle the merge (increment qty).
      if (!guestVariantId) {
        const existingWithVariant = currentCart.cart.find(
          (item: any) => item.productId === guestItem.productId && item.variantId
        );
        if (existingWithVariant) {
          // Product exists in cart with a specific variant — guest didn't select one, skip
          skippedItems.push(guestItem.productId);
          continue;
        }
      }

      try {
        await cartServices.addToCart({
          userId,
          productId: guestItem.productId,
          quantity: guestItem.quantity || 1,
          variantId: guestVariantId,
        });
        mergedCount++;
      } catch (error: any) {
        // If stock exceeded, cap quantity to max available stock
        if (error.message?.includes('available in stock')) {
          try {
            await cartServices.setToMaxStock({
              userId,
              productId: guestItem.productId,
              variantId: guestVariantId,
            });
            mergedCount++;
          } catch {
            skippedItems.push(guestItem.productId);
          }
        } else {
          skippedItems.push(guestItem.productId);
          console.warn(`Failed to merge item ${guestItem.productId}:`, error.message);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Cart merged successfully',
      mergedItems: mergedCount,
      skippedItems: skippedItems.length,
    });
  } catch (error) {
    console.error('Cart merge error:', error);
    return NextResponse.json(
      { error: 'Failed to merge cart' },
      { status: 500 }
    );
  }
}
