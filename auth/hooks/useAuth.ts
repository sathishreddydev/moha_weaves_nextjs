'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { User } from '@/shared';

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';
  const user = session?.user as User | null;

  const login = useCallback(async (email: string, password: string) => {
    try {
      // Handle guest cart merging before login
      const guestCart = localStorage.getItem('mohaweavs_guest_cart');
      const guestWishlist = localStorage.getItem('mohaweavs_guest_wishlist');

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        return { success: false, error: 'Invalid email or password' };
      }

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
        await fetch('/api/wishlist/merge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guestWishlistItems: JSON.parse(guestWishlist) })
        });
        localStorage.removeItem('mohaweavs_guest_wishlist');
      }

      router.refresh();
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await signOut({ redirect: false });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [router]);

  return {
    user,
    status,
    isLoading,
    isAuthenticated,
    login,
    logout,
  };
}
