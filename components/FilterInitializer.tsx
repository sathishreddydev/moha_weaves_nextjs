'use client';

import { useEffect } from 'react';
import { useFilterStore } from '@/lib/stores/fillterStore';
import { useSocketStore } from '@/lib/stores/socketStore';

/**
 * Mounts once inside Providers and:
 * 1. Fetches filters on app load (if not already loaded)
 * 2. Re-fetches when the server emits a filter_event via socket
 *
 * No children needed — state lives in useFilterStore.
 */
export function FilterInitializer() {
  const { categories, fetchFilters } = useFilterStore();
  const { socket } = useSocketStore();

  // Initial fetch
  useEffect(() => {
    if (categories.length === 0) {
      fetchFilters();
    }
  }, []);

  // Re-fetch on socket filter_event
  useEffect(() => {
    if (!socket) return;
    socket.on('filter_event', fetchFilters);
    return () => {
      socket.off('filter_event', fetchFilters);
    };
  }, [socket, fetchFilters]);

  return null;
}
