import { io, Socket } from 'socket.io-client';

/**
 * A simplified Socket.IO client service for real-time communication
 */
class SimpleSocketService {
  private socket: Socket | null = null;
  private eventHandlers: Record<string, Function[]> = {};
  private userId: number | null = null;
  
  /**
   * Initialize the socket connection
   */
  initialize(userId: number) {
    this.userId = userId;
    
    if (this.socket) {
      console.log('Socket already initialized');
      return;
    }
    
    // Create a simple socket connection with default parameters
    this.socket = io();
    
    // Set up basic event listeners
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      // Authenticate the connection with user ID
      this.socket?.emit('authenticate', userId);
    });
    
    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
    
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
    
    // Setup message handler
    this.socket.on('new-message', (message) => {
      this.trigger('message', message);
    });
  }
  
  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return !!this.socket?.connected;
  }
  
  /**
   * Send a chat message
   */
  sendMessage(message: any) {
    if (!this.socket?.connected) {
      console.error('Cannot send message: Socket not connected');
      return;
    }
    
    this.socket.emit('send-message', message);
  }
  
  /**
   * Join a chat group
   */
  joinGroup(groupId: number) {
    if (!this.socket?.connected) {
      console.error('Cannot join group: Socket not connected');
      return;
    }
    
    this.socket.emit('join-group', groupId);
  }
  
  /**
   * Leave a chat group
   */
  leaveGroup(groupId: number) {
    if (!this.socket?.connected) {
      console.error('Cannot leave group: Socket not connected');
      return;
    }
    
    this.socket.emit('leave-group', groupId);
  }
  
  /**
   * Register an event handler
   */
  on(event: string, callback: Function) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    
    this.eventHandlers[event].push(callback);
  }
  
  /**
   * Unregister an event handler
   */
  off(event: string, callback: Function) {
    if (!this.eventHandlers[event]) return;
    
    this.eventHandlers[event] = this.eventHandlers[event].filter(
      (handler) => handler !== callback
    );
  }
  
  /**
   * Trigger an event with data
   */
  private trigger(event: string, data: any) {
    if (!this.eventHandlers[event]) return;
    
    for (const handler of this.eventHandlers[event]) {
      handler(data);
    }
  }
  
  /**
   * Disconnect the socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Export a single instance for the entire application
export const simpleSocketService = new SimpleSocketService();