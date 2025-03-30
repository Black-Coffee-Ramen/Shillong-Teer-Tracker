import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import NumberGrid from "@/components/play/NumberGrid";
import BettingForm from "@/components/play/BettingForm";
import BettingCart from "@/components/play/BettingCart";
import { Calendar, Clock, ShoppingCart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BetItem {
  number: number;
  amount: number;
  round: number;
}

export default function PlayPage() {
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  const [countdown, setCountdown] = useState<string>("--:--:--");
  const [isClosed, setIsClosed] = useState<boolean>(false);
  const [isNearingClose, setIsNearingClose] = useState<boolean>(false);
  const [isSunday, setIsSunday] = useState<boolean>(false);
  const [currentBetAmount, setCurrentBetAmount] = useState<number>(0);
  const [cartItems, setCartItems] = useState<BetItem[]>([]);
  
  // Update current date and time for Kolkata IST
  useEffect(() => {
    // Check if today is Sunday (0 is Sunday in JavaScript)
    const checkIfSunday = () => {
      // Get day in Kolkata time zone
      const options: Intl.DateTimeFormatOptions = { 
        timeZone: 'Asia/Kolkata', 
        weekday: 'long' as const 
      };
      const dayInKolkata = new Intl.DateTimeFormat('en-US', options).format(new Date());
      return dayInKolkata === 'Sunday';
    };
    
    setIsSunday(checkIfSunday());
    
    const updateDateTime = () => {
      // Create a new Date object for the current time
      const now = new Date();
      
      // Use Intl.DateTimeFormat to get proper Kolkata time values
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
      });
      
      // Get date parts as a string like "3/30/2025, 19:40:00"
      const kolkataTimeStr = formatter.format(now);
      
      // Parse the string to create a new Date object
      // This isn't a perfect solution due to JS Date limitations
      // but ensures we're getting the correct Kolkata time
      const [datePart, timePart] = kolkataTimeStr.split(', ');
      const [month, day, year] = datePart.split('/');
      const [hour, minute, second] = timePart.split(':');
      
      // Create a new date with the Kolkata time values
      // Note: month is 0-indexed in JavaScript Date
      const kolkataDate = new Date();
      kolkataDate.setFullYear(parseInt(year));
      kolkataDate.setMonth(parseInt(month) - 1);
      kolkataDate.setDate(parseInt(day));
      kolkataDate.setHours(parseInt(hour));
      kolkataDate.setMinutes(parseInt(minute));
      kolkataDate.setSeconds(parseInt(second));
      
      setCurrentDateTime(kolkataDate);
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
      // Get current time in Kolkata timezone
      const now = new Date();
      
      // Get current hour and minute in Kolkata
      const kolkataFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
      });
      
      const kolkataTimeStr = kolkataFormatter.format(now);
      const [kolkataHour, kolkataMinute, kolkataSecond] = kolkataTimeStr.split(':').map(Number);
      
      // Set target time based on selected round (15:30 or 16:30 IST)
      const targetHour = selectedRound === 1 ? 15 : 16;
      const targetMinute = 30;
      
      // Calculate if the round is closed (past the target time)
      const isClosedNow = (kolkataHour > targetHour) || 
                          (kolkataHour === targetHour && kolkataMinute >= targetMinute);
      setIsClosed(isClosedNow);
      
      // Calculate how many seconds until target time
      let targetTimeSeconds = targetHour * 3600 + targetMinute * 60;
      let currentTimeSeconds = kolkataHour * 3600 + kolkataMinute * 60 + kolkataSecond;
      
      // If target time is in the past for today, set it for tomorrow
      if (currentTimeSeconds >= targetTimeSeconds) {
        // Add 24 hours worth of seconds
        targetTimeSeconds += 24 * 3600;
      }
      
      // Calculate seconds difference
      const diffSeconds = targetTimeSeconds - currentTimeSeconds;
      
      // Check if less than 5 minutes to closing
      const isNearingCloseNow = diffSeconds < 5 * 60 && diffSeconds > 0;
      setIsNearingClose(isNearingCloseNow);
      
      // Format the time remaining
      const hours = Math.floor(diffSeconds / 3600);
      const minutes = Math.floor((diffSeconds % 3600) / 60);
      const seconds = diffSeconds % 60;
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };
    
    const updateCountdown = () => {
      const timeRemaining = calculateTimeRemaining();
      setCountdown(timeRemaining);
      
      // Force rerender by updating the currentDateTime
      setCurrentDateTime(new Date());
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
  
  // Add selected numbers to cart
  const addToCart = (amount: number) => {
    if (selectedNumbers.length === 0 || amount <= 0) {
      return;
    }
    
    const newCartItems = selectedNumbers.map(number => ({
      number,
      amount,
      round: selectedRound
    }));
    
    setCartItems(prev => [...prev, ...newCartItems]);
    resetSelection();
  };
  
  // Remove item from cart
  const removeFromCart = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };
  
  // Clear all items from cart
  const clearCart = () => {
    setCartItems([]);
  };
  
  // Process checkout from the cart
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      return;
    }
    
    // Get the current betting form component
    const bettingFormElement = document.querySelector('.betting-form-container');
    if (bettingFormElement) {
      // Scroll to the betting form to show the checkout process
      bettingFormElement.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Use the placeBet function from BettingForm through a custom event
    const placeBetEvent = new CustomEvent('place-bet-from-cart', {
      detail: { cartItems }
    });
    document.dispatchEvent(placeBetEvent);
    
    // After placing bets, clear the cart
    clearCart();
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
          <div className="betting-form-container">
            <BettingForm 
              selectedNumbers={selectedNumbers}
              selectedRound={selectedRound}
              onResetSelection={resetSelection}
              onAddToCart={addToCart}
            />
          </div>
          
          {/* Shopping Cart */}
          {cartItems.length > 0 && (
            <div className="mb-8">
              <BettingCart
                cartItems={cartItems}
                onRemoveItem={removeFromCart}
                onClearCart={clearCart}
                onCheckout={handleCheckout}
                selectedRound={selectedRound}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
