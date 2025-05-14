import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '@/lib/utils';
import type { ChatMessage as ChatMessageType } from '../../services/chat-service';

interface ChatMessageProps {
  message: ChatMessageType;
  isCurrentUser: boolean;
}

export function ChatMessage({ message, isCurrentUser }: ChatMessageProps) {
  // Format the timestamp
  const formattedTime = message.timestamp
    ? formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })
    : '';

  // Get the initials for avatar fallback
  const getInitials = (username?: string) => {
    if (!username) return '?';
    return username
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div
      className={cn(
        'flex items-start gap-2 mb-4',
        isCurrentUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <Avatar className="h-8 w-8">
        <AvatarImage src={`https://avatar.vercel.sh/${message.username || 'user'}.png`} />
        <AvatarFallback>{getInitials(message.username)}</AvatarFallback>
      </Avatar>
      
      <div className="flex flex-col max-w-[75%]">
        {!isCurrentUser && (
          <span className="text-xs text-muted-foreground mb-1">
            {message.username || 'Unknown User'}
          </span>
        )}
        
        <div
          className={cn(
            'rounded-lg px-3 py-2 text-sm',
            isCurrentUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
          )}
        >
          {message.content}
        </div>
        
        <span className="text-xs text-muted-foreground mt-1 self-end">
          {formattedTime}
        </span>
      </div>
    </div>
  );
}