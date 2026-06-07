import { create } from 'zustand';
import { Socket } from 'socket.io-client';
import socketService from '@/realtime/socket';

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
}

interface SocketActions {
  connect: (token?: string) => void;
  disconnect: () => void;
  emit: (event: string, data?: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback?: (data: any) => void) => void;
}

type SocketStore = SocketState & SocketActions;

export const useSocketStore = create<SocketStore>((set) => ({
  socket: null,
  isConnected: false,

  connect: (token?: string) => {
    const socketInstance = socketService.connect(token || undefined);

    // Remove any previously registered store listeners before adding new ones
    // to prevent stacking on hot-reload or reconnect calls.
    const handleConnect = () => set({ isConnected: true });
    const handleDisconnect = () => set({ isConnected: false });

    socketInstance.off('connect').off('disconnect');
    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);

    set({
      socket: socketInstance,
      isConnected: socketInstance.connected,
    });
  },

  disconnect: () => {
    socketService.disconnect();
    set({ socket: null, isConnected: false });
  },

  emit: (event, data) => {
    socketService.emit(event, data);
  },

  on: (event, callback) => {
    socketService.on(event, callback);
  },

  off: (event, callback) => {
    socketService.off(event, callback);
  },
}));
