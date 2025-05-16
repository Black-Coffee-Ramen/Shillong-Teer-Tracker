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
    
    // Connect to socket server with retry logic
    const connectWithRetry = (retryCount = 0, maxRetries = 3) => {
      try {
        socketService.connect(user.id);
        console.log(`Socket connection attempt ${retryCount + 1}`);
        
        // After connection, try to authenticate
        setTimeout(() => {
          if (socketService.isConnected()) {
            socketService.authenticate(user.id);
          } else if (retryCount < maxRetries) {
            connectWithRetry(retryCount + 1, maxRetries);
          }
        }, 1000); // Wait 1 second before checking connection
      } catch (error) {
        console.error('Socket connection error:', error);
        
        // Retry with exponential backoff
        if (retryCount < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
          setTimeout(() => connectWithRetry(retryCount + 1, maxRetries), delay);
        }
      }
    };
    
    // Start connection process
    connectWithRetry();
    
    // Track retry attempts
    let retryCount = 0;
    
    // Set up connection status listeners
    const handleConnectionStatus = (status: { connected: boolean, error?: any, reason?: string }) => {
      setConnected(status.connected);
      
      if (!status.connected && status.error) {
        console.error('Socket connection error:', status.error);
        
        if (retryCount < 3) {
          // Will try to reconnect automatically
          retryCount++;
        } else {
          toast({
            title: 'Connection Error',
            description: 'Lost connection to the chat server. Please check your connection.',
            variant: 'destructive',
          });
        }
      }
    };
    
    // Listen for connection status changes
    socketService.on('connection-status', handleConnectionStatus);
    
    // Listen for authentication events
    socketService.on('authenticated', (data: any) => {
      if (data?.success) {
        setConnected(true);
        console.log('Socket authenticated successfully');
      } else {
        setConnected(false);
        console.error('Socket authentication failed:', data?.error);
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