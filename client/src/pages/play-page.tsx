import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import NumberGrid from "@/components/play/NumberGrid";
import BettingForm from "@/components/play/BettingForm";
import { Calendar, Clock } from "lucide-react";

export default function PlayPage() {
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  const [countdown, setCountdown] = useState<string>("--:--:--");
  const [isClosed, setIsClosed] = useState<boolean>(false);
  const [isNearingClose, setIsNearingClose] = useState<boolean>(false);
  const [isSunday, setIsSunday] = useState<boolean>(false);
  
  // Update current date and time for Kolkata IST
  useEffect(() => {
    // Check if today is Sunday (0 is Sunday in JavaScript)
    const checkIfSunday = () => {
      const now = new Date();
      return now.getDay() === 0;
    };
    
    setIsSunday(checkIfSunday());
    
    const updateDateTime = () => {
      // Create date object for Kolkata IST (UTC+5:30)
      const now = new Date();
      // Adjust to Kolkata time
      const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
      setCurrentDateTime(istTime);
    };
    
    // Update immediately and then every second
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Calculate countdown based on selected round
  useEffect(() => {
    if (isSunday) {
      setCountdown("CLOSED");
      setIsClosed(true);
      return;
    }
    
    const calculateTimeRemaining = () => {
      const now = new Date();
      const target = new Date(now);
      
      // Set target time based on selected round (15:30 or 16:30 IST)
      // For India Standard Time (UTC+5:30)
      const targetHour = selectedRound === 1 ? 15 : 16;
      const targetMinute = 30;
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
      const isClosedNow = (nowHour > targetHour) || (nowHour === targetHour && nowMinute >= targetMinute);
      setIsClosed(isClosedNow);
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };
    
    const updateCountdown = () => {
      const timeRemaining = calculateTimeRemaining();
      setCountdown(timeRemaining);
    };
    
    // Update immediately and then every second
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, [selectedRound, isSunday]);
  
  const handleNumberSelect = (num: number) => {
    setSelectedNumbers(prev => {
      if (prev.includes(num)) {
        return prev.filter(n => n !== num);
      } else {
        return [...prev, num];
      }
    });
  };
  
  const resetSelection = () => {
    setSelectedNumbers([]);
  };
  
  // Format date to display
  const formattedDate = currentDateTime.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Kolkata'
  });
  
  // Format time to display
  const formattedTime = currentDateTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  });
  
  return (
    <div className="container mx-auto px-4 py-4">
      {/* Round Selection Tabs */}
      <div className="flex mb-4 bg-gray-800 rounded-lg p-1">
        <button 
          className={cn(
            "flex-1 py-2 rounded-md",
            selectedRound === 1 ? "text-white border-b-2 border-accent" : "text-gray-400"
          )}
          onClick={() => setSelectedRound(1)}
        >
          <div className="text-center">
            <p className="font-medium">Round 1</p>
            <p className="text-xs text-gray-400">15:30 IST</p>
          </div>
        </button>
        <button 
          className={cn(
            "flex-1 py-2 rounded-md",
            selectedRound === 2 ? "text-white border-b-2 border-accent" : "text-gray-400"
          )}
          onClick={() => setSelectedRound(2)}
        >
          <div className="text-center">
            <p className="font-medium">Round 2</p>
            <p className="text-xs text-gray-500">16:30 IST</p>
          </div>
        </button>
      </div>
      
      {/* Kolkata IST Date/Time Display */}
      <div className="bg-gray-800 rounded-xl p-3 mb-4 shadow-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 text-accent mr-2" />
            <p className="text-white text-sm">{formattedDate}</p>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 text-accent mr-2" />
            <p className="text-white text-sm">{formattedTime} <span className="text-gray-400">IST</span></p>
          </div>
        </div>
      </div>
      
      {/* Countdown Timer */}
      <div className={`bg-secondary rounded-xl p-4 mb-4 shadow-md ${isSunday ? 'bg-red-900/30' : isNearingClose ? 'bg-yellow-900/30' : ''}`}>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-white font-medium">Round {selectedRound} closes in:</p>
            {isSunday && <p className="text-red-400 text-xs mt-1">Market closed on Sundays</p>}
          </div>
          <div 
            className={`font-mono font-medium text-xl ${
              isSunday ? 'text-red-500' :
              isClosed ? 'text-red-500' :
              isNearingClose ? 'text-yellow-500 animate-pulse' : 'text-accent'
            }`} 
            id="play-countdown"
          >
            {isSunday ? "CLOSED" : countdown}
          </div>
        </div>
      </div>
      
      {/* Sunday Market Closed Message */}
      {isSunday ? (
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-6 mb-6 text-center">
          <Calendar className="h-16 w-16 text-red-500/80 mx-auto mb-3" />
          <h3 className="text-white text-xl font-medium mb-1">Market Closed Today</h3>
          <p className="text-gray-400 mb-4">Shillong Teer does not operate on Sundays.</p>
          <p className="text-red-300 text-sm">Please come back tomorrow for the next round of betting.</p>
        </div>
      ) : (
        <>
          {/* Number Selection Grid */}
          <NumberGrid 
            onNumberSelect={handleNumberSelect}
            selectedNumbers={selectedNumbers}
          />
          
          {/* Betting Form */}
          <BettingForm 
            selectedNumbers={selectedNumbers}
            selectedRound={selectedRound}
            onResetSelection={resetSelection}
          />
        </>
      )}
    </div>
  );
}
