import { apiRequest } from '@/lib/queryClient';

export interface ChatMessage {
  id?: number;
  userId: number;
  groupId?: number;
  recipientId?: number;
  content: string;
  timestamp?: string;
  username?: string;
  isRead?: boolean;
}

export interface ChatGroup {
  id?: number;
  name: string;
  description?: string;
  createdAt?: string;
  memberCount?: number;
}

export interface ChatUser {
  id: number;
  username: string;
  isOnline?: boolean;
  lastActive?: string;
}

/**
 * Service to handle chat-related operations
 */
export const chatService = {
  /**
   * Send a message to a user or group
   * @param message Message content and metadata
   */
  async sendMessage(message: ChatMessage): Promise<ChatMessage> {
    // For now, we're using fetch directly since we don't have a proper API yet
    const response = await fetch('/api/chat/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    }).then(res => res.json());
    
    return response;
  },

  /**
   * Get messages for a specific chat (user-to-user or group)
   * @param userId Current user ID
   * @param recipientId Optional recipient user ID for 1:1 chats
   * @param groupId Optional group ID for group chats
   */
  async getMessages(userId: number, recipientId?: number, groupId?: number): Promise<ChatMessage[]> {
    let url = '/api/chat/messages';
    
    // Build query parameters based on what's provided
    const params = new URLSearchParams();
    params.append('userId', userId.toString());
    
    if (recipientId) {
      params.append('recipientId', recipientId.toString());
    } else if (groupId) {
      params.append('groupId', groupId.toString());
    }
    
    // Using fetch directly for now
    const response = await fetch(`${url}?${params.toString()}`).then(res => res.json());
    return response;
  },

  /**
   * Get all available chat groups
   */
  async getGroups(): Promise<ChatGroup[]> {
    const response = await fetch('/api/chat/groups').then(res => res.json());
    return response;
  },

  /**
   * Create a new chat group
   * @param group Group information
   */
  async createGroup(group: ChatGroup): Promise<ChatGroup> {
    const response = await fetch('/api/chat/groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(group),
    }).then(res => res.json());
    
    return response;
  },

  /**
   * Join a chat group
   * @param groupId Group ID to join
   * @param userId User ID joining the group
   */
  async joinGroup(groupId: number, userId: number): Promise<any> {
    const response = await fetch('/api/chat/groups/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ groupId, userId }),
    }).then(res => res.json());
    
    return response;
  },

  /**
   * Get all users available to chat with
   */
  async getAvailableUsers(): Promise<ChatUser[]> {
    const response = await fetch('/api/chat/users').then(res => res.json());
    return response;
  },

  /**
   * Mark messages as read
   * @param userId Current user ID
   * @param messageIds IDs of messages to mark as read
   */
  async markAsRead(userId: number, messageIds: number[]): Promise<any> {
    const response = await fetch('/api/chat/messages/read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, messageIds }),
    }).then(res => res.json());
    
    return response;
  }
};