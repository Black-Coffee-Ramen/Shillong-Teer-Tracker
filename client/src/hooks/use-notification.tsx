import { createContext, ReactNode, useContext, useState } from "react";
import { useToast } from "@/hooks/use-toast";

// Define notification types
export type NotificationType = "win" | "near-miss" | "info" | "warning" | "error";

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  playSound: boolean;
}

type NotificationContextType = {
  addNotification: (message: string, type: NotificationType, playSound?: boolean) => void;
  notifications: Notification[];
  clearNotifications: () => void;
  removeNotification: (id: string) => void;
};

const NotificationContext = createContext<NotificationContextType | null>(null);

// Generate random ID for notifications
const generateId = () => Math.random().toString(36).substring(2, 9);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();

  // Add a new notification
  const addNotification = (message: string, type: NotificationType, playSound = true) => {
    const id = generateId();
    const notification = { id, message, type, playSound };
    
    setNotifications((prev) => [...prev, notification]);
    
    // Also show toast for visibility
    toast({
      title: type === "win" ? "Winner!" : 
             type === "near-miss" ? "So Close!" : 
             type === "info" ? "Information" : 
             type === "warning" ? "Warning" : "Error",
      description: message,
      variant: type === "error" ? "destructive" : "default",
    });
    
    // Play sound based on notification type
    if (playSound) {
      playNotificationSound(type);
    }
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
    
    return id;
  };
  
  // Remove a notification by ID
  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };
  
  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };
  
  return (
    <NotificationContext.Provider
      value={{
        addNotification,
        notifications,
        clearNotifications,
        removeNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// Sound effect function
function playNotificationSound(type: NotificationType) {
  let sound: HTMLAudioElement;
  
  // Create audio element based on notification type
  switch (type) {
    case "win":
      sound = new Audio("/sounds/win.mp3");
      break;
    case "near-miss":
      sound = new Audio("/sounds/near-miss.mp3");
      break;
    case "info":
      sound = new Audio("/sounds/info.mp3");
      break;
    case "warning":
      sound = new Audio("/sounds/warning.mp3");
      break;
    case "error":
      sound = new Audio("/sounds/error.mp3");
      break;
    default:
      sound = new Audio("/sounds/notification.mp3");
  }
  
  // Play sound (handle browser restrictions)
  try {
    sound.volume = 0.7; // 70% volume
    sound.play().catch((e) => console.log("Could not play notification sound:", e));
  } catch (error) {
    console.log("Error playing notification sound:", error);
  }
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
}