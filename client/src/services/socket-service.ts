import { io, Socket } from 'socket.io-client';
import { ChatMessage } from './chat-service';

/**
 * Socket.IO client service for real-time communication
 */
class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  
  /**
   * Connect to the Socket.IO server and set up event listeners
   * @param userId The current user's ID
   */
  connect(userId: number) {
    if (this.socket?.connected) {
      console.log('Socket already connected, authenticating...');
      this.authenticate(userId);
      return;
    }
    
    // Use the current host, working in both development and production
    // Create the socket connection with the same origin as the current page
    this.socket = io({
      path: '/socket.io',
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling']  // Try WebSocket first, then fall back to polling
    });
    
    // Set up event listeners
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.authenticate(userId);
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.emit('connection-status', { connected: false, error });
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.emit('connection-status', { connected: false, reason });
    });
    
    this.socket.on('authenticated', (data) => {
      console.log('Socket authenticated:', data);
      this.emit('authenticated', data);
    });
    
    this.socket.on('new-message', (message) => {
      console.log('New message received:', message);
      this.emit('message-received', message);
    });
    
    this.socket.on('messages-marked-read', (data) => {
      console.log('Messages marked as read:', data);
      this.emit('messages-read', data);
    });
    
    this.socket.on('joined-group', (data) => {
      console.log('Joined group:', data);
      this.emit('group-joined', data);
    });
    
    this.socket.on('left-group', (data) => {
      console.log('Left group:', data);
      this.emit('group-left', data);
    });
    
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.emit('socket-error', error);
    });
  }
  
  /**
   * Authenticate the socket connection with the user ID
   * @param userId The user's ID to authenticate with
   */
  authenticate(userId: number) {
    if (!this.socket) {
      console.error('Socket not connected, cannot authenticate');
      return;
    }
    
    this.socket.emit('authenticate', userId);
  }
  
  /**
   * Join a chat group
   * @param groupId The ID of the group to join
   */
  joinGroup(groupId: number) {
    if (!this.socket) {
      console.error('Socket not connected, cannot join group');
      return;
    }
    
    this.socket.emit('join-group', groupId);
  }
  
  /**
   * Leave a chat group
   * @param groupId The ID of the group to leave
   */
  leaveGroup(groupId: number) {
    if (!this.socket) {
      console.error('Socket not connected, cannot leave group');
      return;
    }
    
    this.socket.emit('leave-group', groupId);
  }
  
  /**
   * Send a message to a user or group
   * @param message The message to send
   */
  sendMessage(message: Partial<ChatMessage>) {
    if (!this.socket) {
      console.error('Socket not connected, cannot send message');
      return;
    }
    
    this.socket.emit('send-message', message);
  }
  
  /**
   * Mark messages as read
   * @param messageIds Array of message IDs to mark as read
   */
  markAsRead(messageIds: number[]) {
    if (!this.socket) {
      console.error('Socket not connected, cannot mark messages as read');
      return;
    }
    
    this.socket.emit('mark-read', messageIds);
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
    return this;
  }
  
  /**
   * Remove an event listener
   * @param event Event name
   * @param callback Function to remove
   */
  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(event);
      }
    }
    return this;
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
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Create a singleton instance
export const socketService = new SocketService();