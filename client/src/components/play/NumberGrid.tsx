import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Bet } from "@shared/schema";

interface NumberGridProps {
  onNumberSelect: (num: number) => void;
  selectedNumbers: number[];
}

export default function NumberGrid({ onNumberSelect, selectedNumbers }: NumberGridProps) {
  const [previouslyBetNumbers, setPreviouslyBetNumbers] = useState<number[]>([]);
  
  // Fetch user's past bets
  const { data: bets } = useQuery<Bet[]>({
    queryKey: ["/api/bets"],
  });
  
  // Extract previously bet numbers when bets data changes
  useEffect(() => {
    if (bets && bets.length > 0) {
      // Use an object to track unique numbers
      const uniqueNumbersObj: Record<number, boolean> = {};
      bets.forEach(bet => {
        uniqueNumbersObj[bet.number] = true;
      });
      
      // Convert object keys to array of numbers
      const uniqueBetNumbers = Object.keys(uniqueNumbersObj).map(n => parseInt(n));
      setPreviouslyBetNumbers(uniqueBetNumbers);
    }
  }, [bets]);
  
  const formatNumber = (num: number): string => {
    return num < 10 ? `0${num}` : `${num}`;
  };
  
  return (
    <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl p-6 mb-6 shadow-lg border border-gray-100">
      <h3 className="text-gray-900 font-bold mb-5 text-xl flex items-center">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mr-3">
          <span className="text-primary font-bold">🎯</span>
        </div>
        Select Your Number
      </h3>
      
      <div className="mb-4 overflow-hidden">
        {/* Selected indicators */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex -space-x-2">
            {selectedNumbers.slice(0, 3).map(num => (
              <div key={`indicator-${num}`} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-purple-700 text-white text-sm font-medium flex items-center justify-center border-2 border-white shadow-sm">
                {formatNumber(num)}
              </div>
            ))}
            {selectedNumbers.length > 3 && (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-100 text-gray-700 text-sm font-medium flex items-center justify-center border-2 border-white shadow-sm">
                +{selectedNumbers.length - 3}
              </div>
            )}
          </div>
          
          <div className="text-sm text-gray-500 font-medium">
            {selectedNumbers.length} selected
          </div>
        </div>
        
        {/* Mobile-optimized 10x10 grid with larger touch targets */}
        <div className="grid grid-cols-10 gap-1.5 sm:gap-2 p-2">
          {Array.from({ length: 10 }, (_, row) => (
            // For each row, create 10 columns (0-9) with the pattern
            Array.from({ length: 10 }, (_, col) => {
              // Calculate the number: row + (col * 10) gives us 00,10,20... pattern
              const num = row + (col * 10);
              // Check if selected or previously bet
              const isSelected = selectedNumbers.includes(num);
              const isPreviouslyBet = previouslyBetNumbers.includes(num);
              
              return (
                <button
                  key={num}
                  onClick={() => onNumberSelect(num)}
                  className={cn(
                    "min-h-[32px] w-full aspect-square text-xs sm:text-sm font-bold rounded-lg flex items-center justify-center transition-all duration-200 relative touch-manipulation active:scale-95 border-2",
                    isSelected 
                      ? "bg-gradient-to-br from-primary to-purple-700 text-white hover:from-primary/90 hover:to-purple-700/90 border-primary/60 shadow-lg transform scale-105 shadow-primary/30" 
                      : isPreviouslyBet
                        ? "bg-gradient-to-br from-gray-50 to-white text-gray-900 hover:from-purple-50 hover:to-white border-primary/30 hover:border-primary/60 shadow-sm"
                        : "bg-white text-gray-900 hover:bg-gradient-to-br hover:from-gray-50 hover:to-white border-gray-200 hover:border-gray-400 shadow-sm hover:shadow"
                  )}
                >
                  {formatNumber(num)}
                  {isPreviouslyBet && !isSelected && (
                    <span className="absolute -top-1 -right-1 bg-purple-500 rounded-full w-2.5 h-2.5 sm:w-3 sm:h-3 border border-white"></span>
                  )}
                </button>
              );
            })
          )).flat()}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-6 mb-4 bg-gradient-to-r from-gray-50 to-gray-100/50 p-4 rounded-xl border border-gray-200">
        <div className="flex items-center">
          <div className="w-6 h-6 bg-gradient-to-br from-primary to-purple-700 rounded-lg mr-3 shadow-md"></div>
          <span className="text-gray-700 text-sm font-semibold">Selected</span>
        </div>
        <div className="flex items-center">
          <div className="w-6 h-6 bg-gray-50 border-2 border-primary/30 rounded-lg mr-3 relative shadow-sm">
            <span className="absolute -top-1 -right-1 bg-purple-500 rounded-full w-2 h-2"></span>
          </div>
          <span className="text-gray-600 text-sm font-medium">Previously Bet</span>
        </div>
      </div>
      
      {/* Selected Numbers */}
      <div className="mb-4 bg-gray-50 rounded-lg p-4 border border-gray-100">
        <p className="text-gray-700 text-sm font-medium mb-3">Selected Numbers:</p>
        <div className="flex flex-wrap gap-2.5">
          {selectedNumbers.length === 0 ? (
            <div className="text-gray-400 text-sm italic">No numbers selected yet</div>
          ) : (
            selectedNumbers.map(num => (
              <div key={num} className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium flex items-center shadow-sm">
                {formatNumber(num)}
                <button 
                  className="ml-2.5 text-gray-400 hover:text-purple-700 transition-colors p-1 rounded touch-manipulation"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent the grid button from being clicked
                    onNumberSelect(num);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Previously Bet Numbers */}
      {previouslyBetNumbers.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <p className="text-gray-700 text-sm font-medium mb-3">Your Previously Bet Numbers:</p>
          <div className="flex flex-wrap gap-2.5">
            {previouslyBetNumbers.map(num => (
              <div key={`prev-${num}`} className="bg-white border-2 border-purple-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 shadow-sm">
                {formatNumber(num)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
