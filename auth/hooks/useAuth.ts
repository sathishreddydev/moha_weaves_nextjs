'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { User } from '@/shared';
import { useQueryClient } from '@tanstack/react-query';
import { cartKeys } from '@/hooks/useCartQueries';
import { wishlistKeys } from '@/hooks/useWishlistQueries';

/**
 * Wait for the session to be fully established after signIn().
 * signIn({ redirect: false }) sets the cookie but useSession() needs
 * a moment to pick it up. We poll /api/auth/session to confirm.
 */
async function waitForSession(maxAttempts = 10, interval = 300): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (data?.user?.id) return true;
    } catch { /* ignore */ }
    await new Promise((r) => setTimeout(r, interval));
  }
  return false;
}

export function useAuth() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';
  const user = session?.user as User | null;
  const hasMergedRef = useRef(false);
  const isMergingRef = useRef(false);
  const [isMerging, setIsMerging] = useState(false);

  const mergeGuestData = useCallback(async () => {
    // Prevent concurrent merge calls
    if (isMergingRef.current) return;

    const guestCart = localStorage.getItem('urumi_guest_cart');
    const guestWishlist = localStorage.getItem('urumi_guest_wishlist');

    if (!guestCart && !guestWishlist) return;

    isMergingRef.current = true;
    setIsMerging(true);

    try {
      // Merge guest cart after successful login
      if (guestCart) {
        const res = await fetch('/api/cart/merge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guestCartItems: JSON.parse(guestCart) })
        });
        // Only clear localStorage if merge was successful
        if (res.ok) {
          localStorage.removeItem('urumi_guest_cart');
        } else if (res.status === 401) {
          // Session not ready yet — bail out and let the useEffect retry
          isMergingRef.current = false;
          setIsMerging(false);
          hasMergedRef.current = false;
          return;
        }
      }

      // Merge guest wishlist after successful login
      if (guestWishlist) {
        const parsedWishlist = JSON.parse(guestWishlist);
        const productIds = parsedWishlist.map((item: any) =>
          typeof item === 'string' ? item : item.productId
        ).filter(Boolean);

        if (productIds.length > 0) {
          const res = await fetch('/api/wishlist/merge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guestWishlistItems: productIds })
          });
          // Only clear localStorage if merge was successful
          if (res.ok) {
            localStorage.removeItem('urumi_guest_wishlist');
          }
        } else {
          // No valid items to merge, safe to clear
          localStorage.removeItem('urumi_guest_wishlist');
        }
      }

      // Mark as successfully merged
      hasMergedRef.current = true;
    } catch {
      // On network error, reset so the useEffect can retry
      hasMergedRef.current = false;
    } finally {
      isMergingRef.current = false;
      setIsMerging(false);
      // Invalidate React Query caches to trigger fresh fetches after merge
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
      queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
    }
  }, [queryClient]);

  // Auto-merge guest data on any login method (Google redirect, OTP, credentials)
  useEffect(() => {
    if (status === 'authenticated' && !hasMergedRef.current && !isMergingRef.current) {
      const guestCart = localStorage.getItem('urumi_guest_cart');
      const guestWishlist = localStorage.getItem('urumi_guest_wishlist');
      if (guestCart || guestWishlist) {
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

      // Wait for session cookie to be fully established before merging
      const sessionReady = await waitForSession();
      if (sessionReady) {
        await mergeGuestData();
      }
      // Trigger session refetch so useSession picks up the new state
      await updateSession();
      router.refresh();
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  }, [router, mergeGuestData, updateSession]);

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

      // Wait for session cookie to be fully established before merging
      const sessionReady = await waitForSession();
      if (sessionReady) {
        await mergeGuestData();
      }
      // Trigger session refetch so useSession picks up the new state
      await updateSession();
      router.refresh();
      return { success: true };
    } catch (error) {
      return { success: false, error: 'OTP login failed' };
    }
  }, [router, mergeGuestData, updateSession]);

  const logout = useCallback(async () => {
    try {
      // Clear React Query caches for cart and wishlist
      queryClient.removeQueries({ queryKey: cartKeys.all });
      queryClient.removeQueries({ queryKey: wishlistKeys.all });

      // Reset merge ref so guest data merges correctly on next login
      hasMergedRef.current = false;

      // Call server-side signout to ensure cookie is cleared with correct name/flags
      await fetch('/api/auth/signout', { method: 'POST' }).catch(() => {});

      // Also call NextAuth signOut to clear client-side session state
      await signOut({ redirect: false, callbackUrl: '/login' });

      // Hard redirect to login to ensure session state is fully reset
      window.location.href = '/login';
    } catch (error) {
      // Fallback: force redirect even if signOut fails
      window.location.href = '/login';
    }
  }, [router, queryClient]);

  return {
    user,
    status,
    isLoading,
    isMerging,
    isAuthenticated,
    login,
    loginWithOtp,
    logout,
  };
}
