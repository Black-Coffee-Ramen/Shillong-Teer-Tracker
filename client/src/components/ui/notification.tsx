import React, { useEffect, useState } from "react";
import { XCircle, CheckCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotification, type NotificationType } from "@/hooks/use-notification";
import { cva, type VariantProps } from "class-variance-authority";

const notificationVariants = cva(
  "group fixed right-4 z-50 flex w-full max-w-xs items-center rounded-lg p-4 shadow-md transition-all duration-300 ease-in-out",
  {
    variants: {
      variant: {
        win: "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white",
        "near-miss": "bg-gradient-to-r from-amber-500 to-amber-600 text-white",
        info: "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
        warning: "bg-gradient-to-r from-amber-500 to-amber-600 text-white",
        error: "bg-gradient-to-r from-red-500 to-red-600 text-white",
      },
      position: {
        top: "top-4",
        bottom: "bottom-4",
      },
    },
    defaultVariants: {
      variant: "info",
      position: "top",
    },
  }
);

interface NotificationProps extends VariantProps<typeof notificationVariants> {
  onClose?: () => void;
  message: string;
  id: string;
  type: NotificationType;
}

export function NotificationItem({
  position,
  variant,
  onClose,
  message,
  id,
  type,
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  // Animation effect on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Icon based on notification type
  const Icon = () => {
    switch (type) {
      case "win":
        return <CheckCircle className="h-6 w-6 text-emerald-200" />;
      case "near-miss":
        return <AlertTriangle className="h-6 w-6 text-amber-200" />;
      case "info":
        return <Info className="h-6 w-6 text-blue-200" />;
      case "warning":
        return <AlertTriangle className="h-6 w-6 text-amber-200" />;
      case "error":
        return <XCircle className="h-6 w-6 text-red-200" />;
      default:
        return <Info className="h-6 w-6" />;
    }
  };
  
  return (
    <div
      id={`notification-${id}`}
      className={cn(
        notificationVariants({ variant: type as any, position }),
        "opacity-0 translate-x-full",
        isVisible && "opacity-100 translate-x-0"
      )}
      role="alert"
    >
      <div className="mr-2 flex-shrink-0">
        <Icon />
      </div>
      <div className="ml-3 mr-4 text-sm font-medium">
        {message}
      </div>
      <button
        type="button"
        className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8 text-white/80 hover:text-white focus:ring-2 focus:ring-white/20"
        aria-label="Close"
        onClick={onClose}
      >
        <span className="sr-only">Close</span>
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

export function NotificationContainer() {
  const { notifications, removeNotification } = useNotification();
  
  if (notifications.length === 0) return null;
  
  return (
    <div className="notification-container space-y-2">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          id={notification.id}
          position="top"
          message={notification.message}
          type={notification.type}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}