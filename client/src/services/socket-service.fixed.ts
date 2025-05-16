import { io, Socket } from 'socket.io-client';
import { ChatMessage } from './chat-service';

/**
 * Socket.IO client service for real-time communication
 */
class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  
  /**
   * Check if socket is connected
   * @returns true if connected, false otherwise
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
  
  /**
   * Connect to the Socket.IO server
   * @param userId The current user's ID
   */
  connect(userId: number) {
    if (this.socket?.connected) {
      console.log('Socket already connected, authenticating...');
      this.authenticate(userId);
      return;
    }
    
    // Simple connection with minimal options
    this.socket = io();
    
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.authenticate(userId);
      this.emit('connection-status', { connected: true });
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.emit('connection-status', { connected: false, error });
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.emit('connection-status', { connected: false, reason });
    });
    
    // Set up message receiver
    this.socket.on('new-message', (message) => {
      console.log('New message received:', message);
      this.emit('message-received', message);
    });
  }
  
  /**
   * Authenticate the socket connection with the user ID
   * @param userId The user's ID to authenticate with
   */
  authenticate(userId: number) {
    if (!this.socket) return;
    this.socket.emit('authenticate', userId);
  }
  
  /**
   * Join a chat group
   * @param groupId The ID of the group to join
   */
  joinGroup(groupId: number) {
    if (!this.socket) return;
    this.socket.emit('join-group', groupId);
  }
  
  /**
   * Leave a chat group
   * @param groupId The ID of the group to leave
   */
  leaveGroup(groupId: number) {
    if (!this.socket) return;
    this.socket.emit('leave-group', groupId);
  }
  
  /**
   * Send a message to a user or group
   * @param message The message to send
   */
  sendMessage(message: Partial<ChatMessage>) {
    if (!this.socket) return;
    this.socket.emit('send-message', message);
  }
  
  /**
   * Mark messages as read
   * @param messageIds Array of message IDs to mark as read
   */
  markAsRead(messageIds: number[]) {
    if (!this.socket) return;
    this.socket.emit('mark-as-read', messageIds);
  }
  
  /**
   * Add an event listener
   * @param event Event name
   * @param callback Function to call when the event is emitted
   */
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)?.add(callback);
  }
  
  /**
   * Remove an event listener
   * @param event Event name
   * @param callback Function to remove
   */
  off(event: string, callback: Function) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    callbacks?.delete(callback);
    
    if (callbacks?.size === 0) {
      this.listeners.delete(event);
    }
  }
  
  /**
   * Emit an event to all listeners
   * @param event Event name
   * @param data Data to emit
   */
  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      // Convert Set to Array before iterating to avoid TypeScript downlevelIteration issue
      Array.from(callbacks).forEach(callback => {
        callback(data);
      });
    }
  }
  
  /**
   * Disconnect the socket
   */
  disconnect() {
    if (!this.socket) return;
    
    this.socket.disconnect();
    this.socket = null;
  }
}

export const socketService = new SocketService();