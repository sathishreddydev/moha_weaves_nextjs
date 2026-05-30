'use client';

import { useEffect } from 'react';
import { useFilterStore } from '@/lib/stores/fillterStore';
import { useSocketStore } from '@/lib/stores/socketStore';

/**
 * Mounts once inside Providers and:
 * 1. Fetches filters on app load (uses cached data if already hydrated)
 * 2. Invalidates & re-fetches filters when the server emits a filter_event via socket
 *
 * No children needed — state lives in useFilterStore.
 */
export function FilterInitializer() {
  const fetchFilters = useFilterStore((s) => s.fetchFilters);
  const invalidate = useFilterStore((s) => s.invalidate);
  const { socket } = useSocketStore();

  // Initial fetch — will be a no-op if data is already cached (isHydrated)
  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  // Re-fetch on socket filter_event — invalidates cache first
  useEffect(() => {
    if (!socket) return;
    socket.on('filter_event', invalidate);
    return () => {
      socket.off('filter_event', invalidate);
    };
  }, [socket, invalidate]);

  return null;
}
