import { useEffect, useState } from "react";
import { format } from "date-fns";

interface CountdownTimerProps {
  targetHour: number;
  targetMinute: number;
  label: string;
  roundNumber: number;
}

export default function CountdownTimer({ targetHour, targetMinute, label, roundNumber }: CountdownTimerProps) {
  const [countdown, setCountdown] = useState<string>("--:--:--");
  const [isClosed, setIsClosed] = useState<boolean>(false);
  const [isNearingClose, setIsNearingClose] = useState<boolean>(false);
  
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const target = new Date(now);
      
      target.setHours(targetHour, targetMinute, 0, 0);
      
      // If the target time has already passed today, set target to tomorrow
      if (now > target) {
        target.setDate(target.getDate() + 1);
      }
      
      const diff = target.getTime() - now.getTime();
      
      // Check if less than 5 minutes to closing
      const isNearingCloseNow = diff < 5 * 60 * 1000 && diff > 0;
      setIsNearingClose(isNearingCloseNow);
      
      // Format the time remaining
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      // Check if the round is closed (past the target time)
      const nowHour = now.getHours();
      const nowMinute = now.getMinutes();
      const isClosedNow = 
        (nowHour > targetHour) || 
        (nowHour === targetHour && nowMinute >= targetMinute);
      
      setIsClosed(isClosedNow);
      
      return {
        formatted: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
        hours,
        minutes,
        seconds
      };
    };
    
    const { formatted } = calculateTimeRemaining();
    setCountdown(formatted);
    
    const interval = setInterval(() => {
      const { formatted } = calculateTimeRemaining();
      setCountdown(formatted);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [targetHour, targetMinute]);
  
  // Determine the right color for the countdown
  const getTimerColor = () => {
    if (isClosed) return "text-red-500";
    if (isNearingClose) return "text-amber-500"; 
    return "text-gray-800";
  };
  
  return (
    <div className={`
      transition-all duration-300
      ${isNearingClose ? 'bg-amber-50 border-amber-200' : ''}
    `}>
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          {isNearingClose && (
            <div className="w-2 h-2 bg-amber-500 rounded-full mr-2 animate-pulse"></div>
          )}
          {isClosed && (
            <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
          )}
        </div>
        <div className="text-right">
          <p className={`text-xs font-medium ${isNearingClose ? 'text-amber-600' : 'text-gray-500'}`}>
            {isClosed ? "Closed" : "Closes in"}
          </p>
          <p className={`font-mono font-medium text-base ${getTimerColor()} ${isNearingClose ? 'animate-pulse' : ''}`}>
            {countdown}
          </p>
        </div>
      </div>
    </div>
  );
}
