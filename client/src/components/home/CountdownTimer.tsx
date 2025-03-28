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
      const isNearingClose = diff < 5 * 60 * 1000;
      
      // Format the time remaining
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      // Check if the round is closed (past the target time)
      const isClosedNow = now.getHours() >= targetHour && now.getMinutes() >= targetMinute;
      setIsClosed(isClosedNow);
      
      return {
        formatted: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
        isNearingClose
      };
    };
    
    const { formatted, isNearingClose } = calculateTimeRemaining();
    setCountdown(formatted);
    
    const interval = setInterval(() => {
      const { formatted, isNearingClose } = calculateTimeRemaining();
      setCountdown(formatted);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [targetHour, targetMinute]);
  
  return (
    <div className="border border-gray-700 rounded-lg p-3">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-white font-medium">Round {roundNumber}</h3>
          <p className="text-gray-400 text-sm">{label}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">
            {isClosed ? "Closed" : "Closes in"}
          </p>
          <p className={`font-mono font-medium ${roundNumber === 1 ? "text-accent" : "text-gray-300"}`}>
            {countdown}
          </p>
        </div>
      </div>
    </div>
  );
}
