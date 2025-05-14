import React, { createContext, useContext, useEffect, useState } from 'react';
import { socketService } from '../services/socket-service';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';

interface SocketContextType {
  connected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  connected: false,
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Initialize socket connection when user logs in
  useEffect(() => {
    if (!user) return;
    
    // Connect to socket server
    socketService.connect(user.id);
    
    // Set up connection status listeners
    const handleConnectionStatus = (status: { connected: boolean, error?: any, reason?: string }) => {
      setConnected(status.connected);
      
      if (!status.connected && status.error) {
        console.error('Socket connection error:', status.error);
        toast({
          title: 'Connection Error',
          description: 'Lost connection to the chat server. Please check your connection.',
          variant: 'destructive',
        });
      }
    };
    
    // Listen for connection status changes
    socketService.on('connection-status', handleConnectionStatus);
    
    // Listen for authentication events
    socketService.on('authenticated', (data) => {
      if (data.success) {
        setConnected(true);
        console.log('Socket authenticated successfully');
      } else {
        setConnected(false);
        console.error('Socket authentication failed:', data.error);
      }
    });
    
    // Cleanup function
    return () => {
      socketService.off('connection-status', handleConnectionStatus);
      socketService.off('authenticated', () => {});
      socketService.disconnect();
    };
  }, [user, toast]);
  
  return (
    <SocketContext.Provider value={{ connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}