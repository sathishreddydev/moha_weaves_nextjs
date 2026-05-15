// src/realtime/socket.ts

import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;

  private socketUrl: string;

  constructor() {
    this.socketUrl =
      process.env.ADMIN_PUBLIC_SOCKET_URL ||
      "http://localhost:5000";
  }

  // CONNECT SOCKET
  connect(token?: string): Socket {

    // If already connected, return existing socket
    if (this.socket?.connected) {
      return this.socket;
    }

    // If socket exists but is disconnected, clean it up before reconnecting
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.socket = io(this.socketUrl, {

      // JWT AUTH (only if token provided)
      auth: token ? { token } : undefined,

      // CONNECTION SETTINGS
      autoConnect: true,

      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,

      // WEBSOCKET ONLY
      transports: ["websocket"],

      // REQUIRED IF USING COOKIES/CREDENTIALS
      withCredentials: true,
    });

    // CONNECTED
    this.socket.on("connect", () => {
    });

    // DISCONNECTED
    this.socket.on("disconnect", (reason) => {
    });

    // CONNECTION ERROR
    this.socket.on("connect_error", (error) => {
    });

    // RECONNECT ATTEMPT
    this.socket.io.on(
      "reconnect_attempt",
      (attempt) => {
      }
    );

    // RECONNECTED
    this.socket.io.on(
      "reconnect",
      (attempt) => {
      }
    );

    return this.socket;
  }

  // DISCONNECT SOCKET
  disconnect(): void {

    if (this.socket) {

      this.socket.removeAllListeners();

      this.socket.disconnect();

      this.socket = null;
    }
  }

  // GET SOCKET INSTANCE
  getSocket(): Socket | null {
    return this.socket;
  }

  // CHECK CONNECTION
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // EMIT EVENT
  emit(event: string, data?: any): void {

    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit(event, data);
  }

  // LISTEN EVENT
  on(
    event: string,
    callback: (data: any) => void
  ): void {

    if (!this.socket) {
      return;
    }

    this.socket.on(event, callback);
  }

  // REMOVE EVENT LISTENER
  off(
    event: string,
    callback?: (data: any) => void
  ): void {

    if (!this.socket) return;

    this.socket.off(event, callback);
  }

  // REMOVE ALL LISTENERS
  removeAllListeners(): void {

    if (!this.socket) return;

    this.socket.removeAllListeners();
  }
}

// SINGLETON INSTANCE
const socketService = new SocketService();

export default socketService;