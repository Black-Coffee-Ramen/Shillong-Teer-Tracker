import { apiRequest } from '@/lib/queryClient';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface AIResponse {
  message: string;
  content?: string;
  status: 'success' | 'error';
}

/**
 * Service to handle AI-related operations
 */
export const aiService = {
  /**
   * Send a message to the AI assistant
   * @param message The user's message
   * @param context Optional previous messages for context
   */
  async sendMessage(message: string, context: ChatMessage[] = []): Promise<AIResponse> {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, context }),
      }).then(res => res.json());
      
      return {
        message: response.message,
        status: 'success'
      };
    } catch (error) {
      console.error('Error sending message to AI:', error);
      return {
        message: 'Sorry, I encountered an error processing your request. Please try again.',
        status: 'error'
      };
    }
  },

  /**
   * Get help content for a specific topic
   * @param topic The help topic
   */
  async getHelpContent(topic: string): Promise<AIResponse> {
    try {
      const response = await fetch('/api/ai/help', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic }),
      }).then(res => res.json());
      
      return {
        message: response.content,
        status: 'success'
      };
    } catch (error) {
      console.error('Error fetching help content:', error);
      return {
        message: 'Sorry, I could not retrieve help content at this time. Please try again later.',
        status: 'error'
      };
    }
  }
};