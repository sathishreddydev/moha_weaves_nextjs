"use client";

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Real-time event types
export interface RealtimeEvent {
  type: 'product' | 'category' | 'order' | 'inventory' | 'user' | 'store';
  action: 'create' | 'update' | 'delete' | 'stock_change';
  data: any;
  timestamp: number;
  userId?: string;
}

interface UseRealtimeOptions {
  autoConnect?: boolean;
  rooms?: string[];
}

export function useRealtime(options: UseRealtimeOptions = {}) {
  const { autoConnect = true, rooms = [] } = options;
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const eventHandlersRef = useRef<Map<string, Function[]>>(new Map());

  useEffect(() => {
    if (!autoConnect) return;

    // Use environment variable or fallback to remote server, then localhost
    const serverUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 
                     (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
                      ? 'http://localhost:5000' 
                      : 'http://103.127.146.58:5000');

    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      timeout: 5000,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('🔌 Connected to real-time server:', serverUrl);
      setConnected(true);
      
      // Join rooms
      rooms.forEach(room => {
        newSocket.emit('join_room', room);
      });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from real-time server:', reason);
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.warn('🔌 WebSocket connection failed:', error.message);
      setConnected(false);
    });

    newSocket.on('data_update', (event: RealtimeEvent) => {
      console.log('📡 Real-time update received:', event);
      setLastEvent(event);
      
      // Call registered event handlers
      const key = `${event.type}_${event.action}`;
      const handlers = eventHandlersRef.current.get(key) || [];
      handlers.forEach(handler => handler(event));
      
      // Call type-specific handlers
      const typeHandlers = eventHandlersRef.current.get(event.type) || [];
      typeHandlers.forEach(handler => handler(event));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [autoConnect, rooms]);

  // Register event handler
  const onEvent = (type: string, action: string, handler: (event: RealtimeEvent) => void) => {
    const key = `${type}_${action}`;
    const handlers = eventHandlersRef.current.get(key) || [];
    handlers.push(handler);
    eventHandlersRef.current.set(key, handlers);
    
    // Return cleanup function
    return () => {
      const currentHandlers = eventHandlersRef.current.get(key) || [];
      const filtered = currentHandlers.filter(h => h !== handler);
      eventHandlersRef.current.set(key, filtered);
    };
  };

  // Register type-specific handler
  const onType = (type: string, handler: (event: RealtimeEvent) => void) => {
    const handlers = eventHandlersRef.current.get(type) || [];
    handlers.push(handler);
    eventHandlersRef.current.set(type, handlers);
    
    // Return cleanup function
    return () => {
      const currentHandlers = eventHandlersRef.current.get(type) || [];
      const filtered = currentHandlers.filter(h => h !== handler);
      eventHandlersRef.current.set(type, filtered);
    };
  };

  // Join room
  const joinRoom = (room: string) => {
    if (socket) {
      socket.emit('join_room', room);
    }
  };

  // Leave room
  const leaveRoom = (room: string) => {
    if (socket) {
      socket.emit('leave_room', room);
    }
  };

  return {
    socket,
    connected,
    lastEvent,
    onEvent,
    onType,
    joinRoom,
    leaveRoom
  };
}

// Specific hooks for common use cases
export function useProductUpdates(onUpdate?: (event: RealtimeEvent) => void) {
  const { onEvent, ...rest } = useRealtime({ rooms: ['products'] });
  
  useEffect(() => {
    if (onUpdate) {
      return onEvent('product', 'update', onUpdate);
    }
  }, [onUpdate, onEvent]);
  
  return rest;
}

export function useCategoryUpdates(onUpdate?: (event: RealtimeEvent) => void) {
  const { onEvent, ...rest } = useRealtime({ rooms: ['categories'] });
  
  useEffect(() => {
    if (onUpdate) {
      return onEvent('category', 'update', onUpdate);
    }
  }, [onUpdate, onEvent]);
  
  return rest;
}

export function useOrderUpdates(onUpdate?: (event: RealtimeEvent) => void) {
  const { onEvent, ...rest } = useRealtime({ rooms: ['orders'] });
  
  useEffect(() => {
    if (onUpdate) {
      return onEvent('order', 'update', onUpdate);
    }
  }, [onUpdate, onEvent]);
  
  return rest;
}

export function useInventoryUpdates(onUpdate?: (event: RealtimeEvent) => void) {
  const { onEvent, ...rest } = useRealtime({ rooms: ['inventory'] });
  
  useEffect(() => {
    if (onUpdate) {
      return onEvent('inventory', 'stock_change', onUpdate);
    }
  }, [onUpdate, onEvent]);
  
  return rest;
}
