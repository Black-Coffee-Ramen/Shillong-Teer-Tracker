import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import NumberGrid from "@/components/play/NumberGrid";
import BettingForm from "@/components/play/BettingForm";
import { Button } from "@/components/ui/button";
import { Calendar, Clock } from "lucide-react";

export default function PlayPage() {
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  const [countdown, setCountdown] = useState<string>("--:--:--");
  const [isClosed, setIsClosed] = useState<boolean>(false);
  const [isNearingClose, setIsNearingClose] = useState<boolean>(false);
  const [isSunday, setIsSunday] = useState<boolean>(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  
  // Simplified: Update current date and time
  useEffect(() => {
    // Check if today is Sunday
    const checkIfSunday = () => {
      const options: Intl.DateTimeFormatOptions = { 
        timeZone: 'Asia/Kolkata', 
        weekday: 'long' as const 
      };
      const dayInKolkata = new Intl.DateTimeFormat('en-US', options).format(new Date());
      return dayInKolkata === 'Sunday';
    };
    
    setIsSunday(checkIfSunday());
    
    // Update date and time every second
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Simplified: Calculate countdown
  useEffect(() => {
    if (isSunday) {
      setCountdown("CLOSED");
      setIsClosed(true);
      return;
    }
    
    const updateCountdown = () => {
      const now = new Date();
      const options = { timeZone: 'Asia/Kolkata', hour12: false } as const;
      const timeString = now.toLocaleTimeString('en-US', options);
      const [hours, minutes, seconds] = timeString.split(':').map(Number);
      
      // Target time based on selected round (15:30 or 16:30 IST)
      const targetHour = selectedRound === 1 ? 15 : 16;
      const targetMinute = 30;
      
      // Check if round is closed
      const isClosedNow = (hours > targetHour) || (hours === targetHour && minutes >= targetMinute);
      setIsClosed(isClosedNow);
      
      // Calculate time remaining
      let targetSeconds = targetHour * 3600 + targetMinute * 60;
      let currentSeconds = hours * 3600 + minutes * 60 + seconds;
      
      // If time already passed for today, show for tomorrow
      if (currentSeconds >= targetSeconds) {
        targetSeconds += 24 * 3600;
      }
      
      const diff = targetSeconds - currentSeconds;
      
      // Check if nearing close (less than 5 minutes)
      setIsNearingClose(diff < 300 && diff > 0);
      
      // Format countdown
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };
    
    const interval = setInterval(() => {
      setCountdown(updateCountdown());
    }, 1000);
    
    // Initial update
    setCountdown(updateCountdown());
    
    return () => clearInterval(interval);
  }, [selectedRound, isSunday]);
  
  // Handle number selection
  const handleNumberSelect = (num: number) => {
    setSelectedNumbers(prev => {
      if (prev.includes(num)) {
        return prev.filter(n => n !== num);
      } else {
        return [...prev, num];
      }
    });
  };
  
  // Reset selection
  const resetSelection = () => {
    setSelectedNumbers([]);
  };
  
  // Format date and time for display
  const formattedDate = currentDateTime.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Kolkata'
  });
  
  const formattedTime = currentDateTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  });
  
  return (
    <div className="container mx-auto px-4 py-4">
      {/* Round Selection Tabs - Simplified UI */}
      <div className="flex mb-4 bg-gray-800 rounded-lg p-1">
        <button 
          className={cn(
            "flex-1 py-2 rounded-md text-white",
            selectedRound === 1 ? "bg-accent" : "bg-gray-700"
          )}
          onClick={() => setSelectedRound(1)}
        >
          <div className="text-center">
            <p className="font-medium">Round 1 (15:30)</p>
          </div>
        </button>
        <button 
          className={cn(
            "flex-1 py-2 rounded-md text-white ml-2",
            selectedRound === 2 ? "bg-accent" : "bg-gray-700"
          )}
          onClick={() => setSelectedRound(2)}
        >
          <div className="text-center">
            <p className="font-medium">Round 2 (16:30)</p>
          </div>
        </button>
      </div>
      
      {/* Date/Time and Countdown - Simplified UI */}
      <div className="bg-gray-800 rounded-xl p-4 mb-4 shadow-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-accent mr-2" />
            <p className="text-white">{formattedDate}</p>
          </div>
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-accent mr-2" />
            <p className="text-white">{formattedTime}</p>
          </div>
        </div>
        
        <div className="mt-3 p-3 rounded-lg bg-gray-700/50">
          <div className="flex justify-between items-center">
            <p className="text-white">Round {selectedRound} closes in:</p>
            <p className={`font-mono font-bold text-xl ${
              isSunday || isClosed ? 'text-red-400' :
              isNearingClose ? 'text-yellow-400 animate-pulse' : 'text-white'
            }`}>
              {isSunday ? "CLOSED" : countdown}
            </p>
          </div>
        </div>
      </div>
      
      {/* Market Closed Message */}
      {isSunday ? (
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-6 mb-6 text-center">
          <h3 className="text-white text-xl font-medium mb-2">Market Closed Today</h3>
          <p className="text-white">Shillong Teer does not operate on Sundays.</p>
        </div>
      ) : (
        <>
          {/* Login Prompt (if not logged in) */}
          {!user ? (
            <div className="bg-gray-800 rounded-xl p-6 mb-6 text-center">
              <h3 className="text-white text-xl font-medium mb-3">Login Required</h3>
              <p className="text-white mb-4">Please login to place bets and view your betting history.</p>
              <Button 
                className="bg-accent hover:bg-accent/90 text-white"
                onClick={() => navigate("/auth")}
              >
                Login / Create Account
              </Button>
            </div>
          ) : (
            <>
              {/* Number Selection Grid */}
              <div className="mb-4">
                <h3 className="text-white text-lg font-medium mb-2">Select Numbers:</h3>
                <NumberGrid 
                  onNumberSelect={handleNumberSelect}
                  selectedNumbers={selectedNumbers}
                />
              </div>
              
              {/* Direct Betting Form */}
              <BettingForm 
                selectedNumbers={selectedNumbers}
                selectedRound={selectedRound}
                onResetSelection={resetSelection}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}