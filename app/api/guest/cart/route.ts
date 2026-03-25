import { NextRequest, NextResponse } from 'next/server';
import { guestStorage } from '@/lib/guest-storage';

export async function GET(request: NextRequest) {
  try {
    // For guest users, return cart from localStorage simulation
    // In a real scenario, this would be handled client-side
    const guestCart = guestStorage.cart.get();
    
    return NextResponse.json({
      success: true,
      data: {
        cart: guestCart,
        count: guestStorage.cart.getCount()
      },
      isGuest: true
    });
  } catch (error) {
    console.error('Guest cart GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch guest cart' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, quantity, variantId, product } = body;

    if (!productId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Product ID is required' 
      }, { status: 400 });
    }

    // Add to guest cart
    guestStorage.cart.add({
      productId,
      quantity: quantity || 1,
      variantId: variantId || null,
      product
    });

    const updatedCart = guestStorage.cart.get();

    return NextResponse.json({
      success: true,
      data: {
        cart: updatedCart,
        count: guestStorage.cart.getCount()
      },
      isGuest: true
    });
  } catch (error) {
    console.error('Guest cart POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add to guest cart' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, quantity } = body;

    if (!id || quantity === undefined) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cart item ID and quantity are required' 
      }, { status: 400 });
    }

    if (quantity < 1) {
      return NextResponse.json({ 
        success: false, 
        error: 'Quantity must be at least 1' 
      }, { status: 400 });
    }

    // Update guest cart item
    guestStorage.cart.update(id, quantity);

    const updatedCart = guestStorage.cart.get();

    return NextResponse.json({
      success: true,
      data: {
        cart: updatedCart,
        count: guestStorage.cart.getCount()
      },
      isGuest: true
    });
  } catch (error) {
    console.error('Guest cart PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update guest cart item' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const clear = searchParams.get('clear');

    if (clear === 'true') {
      // Clear entire guest cart
      guestStorage.cart.clear();
      
      return NextResponse.json({
        success: true,
        data: {
          cart: [],
          count: 0
        },
        isGuest: true
      });
    }

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cart item ID is required' 
      }, { status: 400 });
    }

    // Remove specific item from guest cart
    guestStorage.cart.remove(id);
    const updatedCart = guestStorage.cart.get();

    return NextResponse.json({
      success: true,
      data: {
        cart: updatedCart,
        count: guestStorage.cart.getCount()
      },
      isGuest: true
    });
  } catch (error) {
    console.error('Guest cart DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove from guest cart' },
      { status: 500 }
    );
  }
}
