import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth/config/auth';
import { wishlistServices } from '../wishlistService';
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

    // Get guest wishlist from request body
    const { guestWishlistItems } = await request.json();

    // Handle case where guest wishlist might be empty or invalid
    if (!guestWishlistItems) {
      // No guest wishlist to merge - just return success
      return NextResponse.json({
        success: true,
        message: 'No guest wishlist to merge',
        mergedItems: 0,
      });
    }

    if (!Array.isArray(guestWishlistItems)) {
      return NextResponse.json(
        { error: 'Invalid guest wishlist data format' },
        { status: 400 }
      );
    }

    // Merge guest wishlist with user wishlist
    await mergeGuestWishlistToUser(session.user as User, guestWishlistItems);

    return NextResponse.json({
      success: true,
      message: 'Wishlist merged successfully',
      mergedItems: guestWishlistItems.length,
    });
  } catch (error) {
    console.error('Wishlist merge error:', error);
    return NextResponse.json(
      { error: 'Failed to merge wishlist' },
      { status: 500 }
    );
  }
}

// Helper function to merge guest wishlist to user wishlist
async function mergeGuestWishlistToUser(user: User, guestWishlistItems: string[]): Promise<void> {
  try {
    if (guestWishlistItems.length === 0) {
      return; // No items to merge
    }

    // Get current user wishlist
    const userWishlist = await wishlistServices.getWishlistItems(user.id);
    const existingProductIds = userWishlist.wishlist?.map((item: any) => item.productId) || [];

    // Filter out items that already exist in user wishlist
    const newItems = guestWishlistItems.filter(productId => !existingProductIds.includes(productId));

    if (newItems.length === 0) {
      console.log('No new wishlist items to merge for user', user.id);
      return;
    }

    // Add new items to user wishlist
    for (const productId of newItems) {
      await wishlistServices.addToWishlist({
        userId: user.id,
        productId
      });
    }

    console.log(`Successfully merged ${newItems.length} new wishlist items for user ${user.id}`);
  } catch (error) {
    console.error('Error merging guest wishlist to user wishlist:', error);
    throw error;
  }
}
