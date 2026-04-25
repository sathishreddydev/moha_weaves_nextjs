import { RealtimeEvent, useRealtime } from '@/hooks/useRealtime';
import React, { createContext, useContext, ReactNode } from 'react';

interface RealtimeContextType {
  connected: boolean;
  lastEvent: RealtimeEvent | null;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

interface RealtimeProviderProps {
  children: ReactNode;
  rooms?: string[];
}

export function RealtimeProvider({ children, rooms = [] }: RealtimeProviderProps) {
  const realtime = useRealtime({ autoConnect: true, rooms });

  const value: RealtimeContextType = {
    connected: realtime.connected,
    lastEvent: realtime.lastEvent,
    joinRoom: realtime.joinRoom,
    leaveRoom: realtime.leaveRoom
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtimeContext() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtimeContext must be used within a RealtimeProvider');
  }
  return context;
}

// HOC for components that need real-time updates
export function withRealtime<P extends object>(
  Component: React.ComponentType<P>,
  rooms: string[] = []
) {
  return function WithRealtimeComponent(props: P) {
    return (
      <RealtimeProvider rooms={rooms}>
        <Component {...props} />
      </RealtimeProvider>
    );
  };
}
