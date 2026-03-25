import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth/config/auth';
import { cartServices } from './cartService';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user;
    
    if (!user?.id) {
      return NextResponse.json({
        success: true,
        data: { items: [], count: 0 },
        isGuest: true,
        message: 'Guest cart should be handled client-side'
      });
    }
    
    const cart = await cartServices.getCartItems(user.id);
    return NextResponse.json({
      success: true,
      data: cart,
      isGuest: false
    });
  } catch (error) {
    console.error('Cart GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user;
    if (!user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, quantity, variantId } = body;

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 });
    }
    const cart = await cartServices.addToCart({
      userId: user.id,
      productId,
      quantity: quantity || 1,
      variantId: variantId || null
    });

    return NextResponse.json({
      success: true,
      data: cart
    });
  } catch (error: any) {
    console.error('Cart POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add to cart' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user;
    if (!user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, quantity } = body;

    if (!id || quantity === undefined) {
      return NextResponse.json({ success: false, error: 'Cart item ID and quantity are required' }, { status: 400 });
    }

    const cart = await cartServices.updateCartItem(id, quantity, user.id);

    return NextResponse.json({
      success: true,
      data: cart
    });
  } catch (error: any) {
    console.error('Cart PUT error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update cart item' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user;
    if (!user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const clear = searchParams.get('clear');

    if (clear === 'true') {
      const result = await cartServices.clearCart(user.id);
      return NextResponse.json({
        success: true,
        data: result
      });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Cart item ID is required' }, { status: 400 });
    }

    const cart = await cartServices.removeFromCart(id, user.id);

    return NextResponse.json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Cart DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove from cart' },
      { status: 500 }
    );
  }
}
