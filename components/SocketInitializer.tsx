'use client';

import { useEffect } from 'react';
import { useSocketStore } from '@/lib/stores/socketStore';

/**
 * Mounts once inside Providers and initialises the socket connection.
 * No children needed — state lives in the Zustand store.
 */
export function SocketInitializer() {
  const { connect, disconnect } = useSocketStore();

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, []);

  return null;
}
