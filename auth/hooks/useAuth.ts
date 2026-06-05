'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import { User } from '@/shared';
import { useQueryClient } from '@tanstack/react-query';
import { cartKeys } from '@/hooks/useCartQueries';
import { wishlistKeys } from '@/hooks/useWishlistQueries';

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';
  const user = session?.user as User | null;
  const hasMergedRef = useRef(false);

  const mergeGuestData = useCallback(async () => {
    const guestCart = localStorage.getItem('urumi_guest_cart');
    const guestWishlist = localStorage.getItem('urumi_guest_wishlist');

    // Merge guest cart after successful login
    if (guestCart) {
      await fetch('/api/cart/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestCartItems: JSON.parse(guestCart) })
      });
      localStorage.removeItem('urumi_guest_cart');
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
      localStorage.removeItem('urumi_guest_wishlist');
    }

    // Invalidate React Query caches to trigger fresh fetches
    queryClient.invalidateQueries({ queryKey: cartKeys.all });
    queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
  }, [queryClient]);

  // Auto-merge guest data on any login method (Google redirect, OTP, credentials)
  useEffect(() => {
    if (status === 'authenticated' && !hasMergedRef.current) {
      const guestCart = localStorage.getItem('urumi_guest_cart');
      const guestWishlist = localStorage.getItem('urumi_guest_wishlist');
      if (guestCart || guestWishlist) {
        hasMergedRef.current = true;
        mergeGuestData();
      }
    }
  }, [status, mergeGuestData]);

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
      // Clear React Query caches for cart and wishlist
      queryClient.removeQueries({ queryKey: cartKeys.all });
      queryClient.removeQueries({ queryKey: wishlistKeys.all });
      await signOut({ redirect: false });
      router.push('/login');
      router.refresh();
    } catch (error) {
    }
  }, [router, queryClient]);

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
