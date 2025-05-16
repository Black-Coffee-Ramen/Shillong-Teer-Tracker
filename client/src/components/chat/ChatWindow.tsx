import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Send } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { chatService, type ChatMessage as ChatMessageType } from '../../services/chat-service';
import { socketService } from '../../services/socket-service';
import { useToast } from '@/hooks/use-toast';

interface ChatWindowProps {
  currentUserId: number;
  recipientId?: number;
  groupId?: number;
  chatName: string;
  onBack?: () => void;
}

export function ChatWindow({ 
  currentUserId, 
  recipientId, 
  groupId, 
  chatName, 
  onBack 
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Fetch chat messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const fetchedMessages = await chatService.getMessages(
          currentUserId,
          recipientId,
          groupId
        );
        setMessages(fetchedMessages);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        toast({
          title: 'Error',
          description: 'Failed to load chat messages',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    
    // Connect to socket and set up message listener
    socketService.connect(currentUserId);
    
    // Join the group if this is a group chat
    if (groupId) {
      socketService.joinGroup(groupId);
    }
    
    // Handle new messages
    const handleNewMessage = (message: ChatMessageType) => {
      // Only add the message if it's relevant to this chat
      if (
        (groupId && message.groupId === groupId) ||
        (recipientId && (
          (message.userId === recipientId && message.recipientId === currentUserId) ||
          (message.userId === currentUserId && message.recipientId === recipientId)
        ))
      ) {
        setMessages(prev => [...prev, message]);
      }
    };
    
    // Register the event handler
    socketService.on('message-received', handleNewMessage);
    
    // Cleanup function to unsubscribe from WebSocket
    return () => {
      socketService.off('message-received', handleNewMessage);
      
      // Leave the group when component unmounts
      if (groupId) {
        socketService.leaveGroup(groupId);
      }
    };
  }, [currentUserId, recipientId, groupId, toast]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    try {
      const message: ChatMessageType = {
        userId: currentUserId,
        content: newMessage,
        timestamp: new Date().toISOString(),
      };
      
      // Add recipient or group ID based on chat type
      if (recipientId) {
        message.recipientId = recipientId;
      } else if (groupId) {
        message.groupId = groupId;
      }
      
      // Add message to local state immediately for responsive UI
      const tempMessage = {
        ...message,
        username: 'You' // Temporary for UI until real data arrives
      };
      setMessages([...messages, tempMessage]);
      setNewMessage('');
      
      // First, send message to server via HTTP to store in database
      const savedMessage = await chatService.sendMessage(message);
      
      // Then, emit the message through Socket.IO for real-time delivery
      if (savedMessage) {
        socketService.sendMessage({
          id: savedMessage.id,
          content: savedMessage.content,
          recipientId: savedMessage.recipientId,
          groupId: savedMessage.groupId,
          userId: savedMessage.userId
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <Card className="flex flex-col h-[600px] max-h-[80vh]">
      <CardHeader className="bg-gray-900 text-white px-4 py-3 rounded-t-lg">
        <div className="flex items-center">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              className="mr-2 text-white hover:text-white hover:bg-gray-800"
              onClick={onBack}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </Button>
          )}
          <CardTitle className="text-lg">{chatName}</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <ChatMessage
                  key={message.id || index}
                  message={message}
                  isCurrentUser={message.userId === currentUserId}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex w-full gap-2">
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}