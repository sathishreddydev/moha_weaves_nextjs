'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSocketStore } from '@/lib/stores/socketStore';
import socketService from '@/realtime/socket';

/**
 * Mounts once inside Providers and initialises the socket connection.
 * Re-connects with a fresh token whenever the user authenticates so the
 * socket joins the correct user:{userId} room on the server.
 *
 * Uses useSession() directly to get the accessToken — avoids the httpOnly
 * cookie limitation that AuthTokenManager.getAccessToken() runs into.
 */
export function SocketInitializer() {
  const { disconnect } = useSocketStore();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    // Disconnect any existing socket first
    disconnect();

    // Get accessToken directly from the NextAuth session object
    const token = (session as any)?.accessToken as string | undefined;

    // Reconnect with the fresh token (or as guest if logged out)
    setTimeout(() => {
      socketService.connect(token || undefined);
      useSocketStore.setState({
        socket: socketService.getSocket(),
        isConnected: socketService.isConnected(),
      });
    }, 100);
  }, [status, (session as any)?.accessToken]);

  return null;
}
