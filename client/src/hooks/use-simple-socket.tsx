import React, { createContext, useContext, useEffect, useState } from 'react';
import { simpleSocketService } from '../services/simple-socket';
import { useAuth } from './use-auth';

interface SocketContextType {
  connected: boolean;
  sendMessage: (message: any) => void;
  joinGroup: (groupId: number) => void;
  leaveGroup: (groupId: number) => void;
}

const SocketContext = createContext<SocketContextType>({
  connected: false,
  sendMessage: () => {},
  joinGroup: () => {},
  leaveGroup: () => {},
});

export function SimpleSocketProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) return;
    
    // Initialize socket connection
    simpleSocketService.initialize(user.id);
    
    // Check connection status periodically
    const checkConnectionInterval = setInterval(() => {
      const isConnected = simpleSocketService.isConnected();
      setConnected(isConnected);
    }, 3000);
    
    // Clean up on unmount
    return () => {
      clearInterval(checkConnectionInterval);
      simpleSocketService.disconnect();
    };
  }, [user]);
  
  const socketContextValue = {
    connected,
    sendMessage: (message: any) => simpleSocketService.sendMessage(message),
    joinGroup: (groupId: number) => simpleSocketService.joinGroup(groupId),
    leaveGroup: (groupId: number) => simpleSocketService.leaveGroup(groupId),
  };
  
  return (
    <SocketContext.Provider value={socketContextValue}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSimpleSocket() {
  return useContext(SocketContext);
}