import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useOfflineBets } from "@/hooks/use-offline-data";
import NumberGrid from "@/components/play/NumberGrid";
import BettingForm from "@/components/play/BettingForm";
import { BettingInterface } from "@/components/play/BettingInterface";
import { BetHistory } from "@/components/play/BetHistory";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, WifiOff } from "lucide-react";

export default function PlayPage() {
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  const [countdown, setCountdown] = useState<string>("--:--:--");
  const [isClosed, setIsClosed] = useState<boolean>(false);
  const [isNearingClose, setIsNearingClose] = useState<boolean>(false);
  const [isSunday, setIsSunday] = useState<boolean>(false);
  const [bettingDate, setBettingDate] = useState<Date>(new Date());
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
  
  // Enhanced countdown calculation with automatic next day reset and date display
  useEffect(() => {
    if (isSunday) {
      setCountdown("CLOSED");
      setIsClosed(true);
      return;
    }
    
    const updateCountdown = () => {
      // Get current date and time 
      const now = new Date();
      
      // Create a target date for today with the target time
      const targetHour = selectedRound === 1 ? 15 : 16; // 15:30 or 16:30
      const targetMinute = 30;
      
      // Create target time for today
      const target = new Date(now);
      target.setHours(targetHour, targetMinute, 0, 0);
      
      // Check if the target time has already passed today
      const isPassed = now >= target;
      
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
      
      // Convert to seconds
      const diffInSeconds = Math.floor(diff / 1000);
      
      // Calculate hours, minutes, seconds
      const h = Math.floor(diffInSeconds / 3600);
      const m = Math.floor((diffInSeconds % 3600) / 60);
      const s = diffInSeconds % 60;
      
      // Update closed state
      const isClosedNow = isPassed;
      setIsClosed(isClosedNow);
      
      // Check if nearing close (less than 5 minutes)
      setIsNearingClose(diff < 300000 && diff > 0); // 300000 ms = 5 minutes
      
      // Format countdown string
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };
    
    // Initial update
    setCountdown(updateCountdown());
    
    // Update every second
    const interval = setInterval(() => {
      setCountdown(updateCountdown());
    }, 1000);
    
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
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Place Your Bet</h1>
        <p className="text-sm text-gray-500">Select your numbers and betting amount</p>
      </div>

      {/* Round Selection Tabs */}
      <div className="card-modern p-5 mb-5">
        <h3 className="section-title mb-3">Select Round</h3>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <button 
            className={cn(
              "py-3 px-4 rounded-md text-sm font-medium flex items-center justify-center transition-colors",
              selectedRound === 1 
                ? "bg-primary text-white shadow-sm" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
            onClick={() => setSelectedRound(1)}
          >
            <div className="flex items-center">
              <div className="w-6 h-6 bg-white/30 rounded-full flex items-center justify-center mr-2">
                <span className="font-medium">1</span>
              </div>
              <span>Round 1 (15:30)</span>
            </div>
          </button>
          <button 
            className={cn(
              "py-3 px-4 rounded-md text-sm font-medium flex items-center justify-center transition-colors",
              selectedRound === 2 
                ? "bg-primary text-white shadow-sm" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
            onClick={() => setSelectedRound(2)}
          >
            <div className="flex items-center">
              <div className="w-6 h-6 bg-white/30 rounded-full flex items-center justify-center mr-2">
                <span className="font-medium">2</span>
              </div>
              <span>Round 2 (16:30)</span>
            </div>
          </button>
        </div>
        
        {/* Countdown with Betting Date */}
        <div className="rounded-md border border-gray-200 p-4 bg-gray-50 flex justify-center">
          <div className="flex flex-col items-center">
            <p className="text-sm text-gray-600 mb-1">
              Round {selectedRound} – Betting for: {`${bettingDate.getDate().toString().padStart(2, '0')}/${(bettingDate.getMonth() + 1).toString().padStart(2, '0')}/${bettingDate.getFullYear()}`}
            </p>
            <p className={`font-mono font-bold text-xl ${
              isSunday || isClosed 
                ? 'text-red-500' 
                : isNearingClose 
                  ? 'text-amber-500 animate-pulse' 
                  : 'text-gray-800'
            }`}>
              {isSunday ? "CLOSED" : countdown}
            </p>
          </div>
        </div>
      </div>
      
      {/* Market Closed Message */}
      {isSunday ? (
        <div className="card-modern p-6 mb-6 text-center">
          <div className="bg-amber-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <Calendar className="h-6 w-6 text-amber-600" />
          </div>
          <h3 className="text-gray-800 text-lg font-medium mb-2">Market Closed Today</h3>
          <p className="text-gray-600">Shillong Teer does not operate on Sundays.</p>
        </div>
      ) : (
        <>
          {/* Login Prompt (if not logged in) */}
          {!user ? (
            <div className="card-modern p-6 mb-6 text-center">
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z"></path><circle cx="16.5" cy="7.5" r=".5"></circle></svg>
              </div>
              <h3 className="text-gray-800 text-xl font-medium mb-3">Login Required</h3>
              <p className="text-gray-600 mb-4">Please login to place bets and view your betting history.</p>
              <Button 
                className="bg-primary hover:bg-primary/90 text-white"
                onClick={() => navigate("/auth")}
              >
                Login / Create Account
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Number Selection Grid - Full Width */}
              <NumberGrid 
                onNumberSelect={handleNumberSelect}
                selectedNumbers={selectedNumbers}
              />
              {selectedNumbers.length > 0 && (
                <div className="card-modern p-6">
                  <BettingForm 
                    selectedNumbers={selectedNumbers}
                    selectedRound={selectedRound}
                    onResetSelection={resetSelection}
                  />
                </div>
              )}
              
              {/* New Betting Interface with Server-Side Time Validation */}
              <BettingInterface />
              
              {/* Bet History Table */}
              <div className="card-modern p-6">
                <BetHistory />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}