'use client';

import { useEffect } from 'react';
import { useFilterStore } from '@/lib/stores/fillterStore';
import { useSocketStore } from '@/lib/stores/socketStore';


export function FilterInitializer() {
  const invalidate = useFilterStore((s) => s.invalidate);
  const { socket } = useSocketStore();

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
