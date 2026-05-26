'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { User } from '@/shared';
import { useCartStore, useWishlistStore } from '@/lib/stores';

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';
  const user = session?.user as User | null;

  const mergeGuestData = useCallback(async () => {
    const guestCart = localStorage.getItem('mohaweavs_guest_cart');
    const guestWishlist = localStorage.getItem('mohaweavs_guest_wishlist');

    // Merge guest cart after successful login
    if (guestCart) {
      await fetch('/api/cart/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestCartItems: JSON.parse(guestCart) })
      });
      localStorage.removeItem('mohaweavs_guest_cart');
    }

    // Merge guest wishlist after successful login
    if (guestWishlist) {
      const parsedWishlist = JSON.parse(guestWishlist);
      const productIds = parsedWishlist.map((item: any) =>
        typeof item === 'string' ? item : item.productId
      ).filter(Boolean);

      if (productIds.length > 0) {
        await fetch('/api/wishlist/merge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guestWishlistItems: productIds })
        });
      }
      localStorage.removeItem('mohaweavs_guest_wishlist');
    }

    // Re-fetch stores immediately after merge so counts are accurate
    await Promise.all([
      useCartStore.getState().fetchCart(),
      useWishlistStore.getState().fetchWishlist(),
    ]);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        return { success: false, error: 'Invalid email or password' };
      }

      await mergeGuestData();
      router.refresh();
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  }, [router, mergeGuestData]);

  const loginWithOtp = useCallback(async (phone: string, userId: string) => {
    try {
      const result = await signIn('otp-login', {
        phone,
        userId,
        redirect: false,
      });

      if (result?.error) {
        return { success: false, error: 'OTP login failed' };
      }

      await mergeGuestData();
      router.refresh();
      return { success: true };
    } catch (error) {
      return { success: false, error: 'OTP login failed' };
    }
  }, [router, mergeGuestData]);

  const logout = useCallback(async () => {
    try {
      await signOut({ redirect: false });
      router.push('/login');
      router.refresh();
    } catch (error) {
    }
  }, [router]);

  return {
    user,
    status,
    isLoading,
    isAuthenticated,
    login,
    loginWithOtp,
    logout,
  };
}
