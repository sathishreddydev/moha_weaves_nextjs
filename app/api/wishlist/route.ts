import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth/config/auth';
import { wishlistServices } from './wishlistService';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // API routes run only on server - no localStorage access
    if (!session?.user?.id) {
      // For unauthenticated users, return empty response
      // Client-side will handle localStorage operations
      return NextResponse.json({
        success: true,
        data: { items: [], count: 0 },
        isGuest: true,
        message: 'Guest wishlist should be handled client-side'
      });
    }

    // For authenticated users, return their wishlist from database
    const wishlist = await wishlistServices.getWishlistItems(session.user.id);
    
    return NextResponse.json({
      success: true,
      data: wishlist,
      isGuest: false
    });
  } catch (error) {
    console.error('Wishlist GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch wishlist' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 });
    }

    // API routes run only on server - no localStorage access
    if (!session?.user?.id) {
      // For unauthenticated users, return error - client should handle localStorage
      return NextResponse.json({
        success: false,
        error: 'Guest wishlist operations should be handled client-side',
        isGuest: true
      }, { status: 401 });
    }

    // For authenticated users, add to database
    const wishlist = await wishlistServices.addToWishlist({
      userId: session.user.id,
      productId
    });

    return NextResponse.json({
      success: true,
      data: wishlist,
      isGuest: false
    });
  } catch (error) {
    console.error('Wishlist POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add to wishlist' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 });
    }

    // API routes run only on server - no localStorage access
    if (!session?.user?.id) {
      // For unauthenticated users, return error - client should handle localStorage
      return NextResponse.json({
        success: false,
        error: 'Guest wishlist operations should be handled client-side',
        isGuest: true
      }, { status: 401 });
    }

    // For authenticated users, remove from database
    const wishlist = await wishlistServices.removeFromWishlist(session.user.id, productId);

    return NextResponse.json({
      success: true,
      data: wishlist,
      isGuest: false
    });
  } catch (error) {
    console.error('Wishlist DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove from wishlist' },
      { status: 500 }
    );
  }
}
