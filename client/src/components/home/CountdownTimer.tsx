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
  const [bettingDate, setBettingDate] = useState<Date>(new Date());
  
  useEffect(() => {
    const calculateTimeRemaining = () => {
      // Get current date and time 
      const now = new Date();
      
      // Create target time for today
      const target = new Date(now);
      target.setHours(targetHour, targetMinute, 0, 0);
      
      // Check if the target time has already passed today
      const isPassed = now > target;
      
      // Set betting date for display
      const newBettingDate = new Date(now);
      
      // If passed, set target and betting date to tomorrow
      if (isPassed) {
        target.setDate(target.getDate() + 1);
        newBettingDate.setDate(newBettingDate.getDate() + 1);
      }
      
      // Update the betting date
      setBettingDate(newBettingDate);
      
      // Calculate time difference in milliseconds
      const diff = target.getTime() - now.getTime();
      
      // Check if less than 5 minutes to closing
      const isNearingCloseNow = diff < 5 * 60 * 1000 && diff > 0;
      setIsNearingClose(isNearingCloseNow);
      
      // Format the time remaining
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      // Update closed state based on whether we've passed today's target time
      setIsClosed(isPassed);
      
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
      p-3 rounded-md
    `}>
      <div className="flex justify-center items-center">
        <div className="text-center">
          <p className={`text-sm font-medium ${isNearingClose ? 'text-amber-600' : 'text-gray-600'}`}>
            Round {roundNumber} – Betting for: {`${bettingDate.getDate().toString().padStart(2, '0')}/${(bettingDate.getMonth() + 1).toString().padStart(2, '0')}/${bettingDate.getFullYear()}`}
          </p>
          <p className={`font-mono font-bold text-xl ${getTimerColor()} ${isNearingClose ? 'animate-pulse' : ''}`}>
            {countdown}
          </p>
          
          {/* Indicator for state */}
          <div className="flex justify-center mt-1">
            {isNearingClose && (
              <div className="flex items-center">
                <div className="w-2 h-2 bg-amber-500 rounded-full mr-1 animate-pulse"></div>
                <span className="text-xs text-amber-600">Closing soon</span>
              </div>
            )}
            {isClosed && (
              <div className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                <span className="text-xs text-red-600">Waiting for tomorrow</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
