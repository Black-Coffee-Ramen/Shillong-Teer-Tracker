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
    <div className="bg-white rounded-2xl p-4 sm:p-5 mb-6 shadow-lg border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-900 font-bold text-lg sm:text-xl flex items-center">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mr-3">
            <span className="text-2xl">🎯</span>
          </div>
          Select Your Number
        </h3>
        <div className="text-sm text-gray-600 font-medium bg-gray-100 px-3 py-1.5 rounded-full">
          {selectedNumbers.length} selected
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 bg-gray-50 p-3 rounded-xl text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gradient-to-br from-primary to-purple-700 rounded-full shadow-md"></div>
          <span className="text-gray-700 font-medium">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
          <span className="text-gray-600">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gray-200 border-2 border-primary/40 rounded-full relative">
            <span className="absolute -top-0.5 -right-0.5 bg-primary rounded-full w-2 h-2"></span>
          </div>
          <span className="text-gray-600">Previously Bet</span>
        </div>
      </div>
      
      {/* Horizontal scrollable number grid */}
      <div className="overflow-x-auto scrollbar-hide -mx-4 sm:mx-0 mb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="inline-block min-w-full px-4 sm:px-0">
          <div className="grid grid-cols-10 gap-1.5 sm:gap-2 w-fit mx-auto">
            {Array.from({ length: 10 }, (_, row) => {
              // Each row shows: 00-90, 01-91, 02-92, etc.
              return Array.from({ length: 10 }, (_, col) => {
                const num = row + (col * 10);
                const isSelected = selectedNumbers.includes(num);
                const isPreviouslyBet = previouslyBetNumbers.includes(num);
                
                return (
                  <button
                    key={num}
                    data-testid={`number-button-${num}`}
                    onClick={() => onNumberSelect(num)}
                    className={cn(
                      "w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm md:text-base transition-all duration-200 relative touch-manipulation active:scale-95",
                      isSelected 
                        ? "bg-gradient-to-br from-primary to-purple-700 text-white shadow-md scale-105 shadow-primary/20" 
                        : isPreviouslyBet
                          ? "bg-gray-200 text-gray-900 border-primary/40 border-2 hover:border-primary/60"
                          : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                    )}
                  >
                    {formatNumber(num)}
                    {isPreviouslyBet && !isSelected && (
                      <span className="absolute -top-0.5 -right-0.5 bg-primary rounded-full w-2.5 h-2.5 sm:w-3 sm:h-3 border border-white"></span>
                    )}
                  </button>
                );
              });
            }).flat()}
          </div>
        </div>
      </div>
      
      {/* Selected Numbers Display */}
      {selectedNumbers.length > 0 && (
        <div className="bg-gradient-to-r from-primary/5 to-purple-50/50 rounded-xl p-4 border border-primary/20">
          <p className="text-gray-700 text-sm font-semibold mb-3">Selected Numbers:</p>
          <div className="flex flex-wrap gap-2">
            {selectedNumbers.map(num => (
              <div 
                key={num} 
                data-testid={`selected-number-${num}`}
                className="bg-gradient-to-br from-primary to-purple-700 text-white rounded-full w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-sm font-bold shadow-lg relative"
              >
                {formatNumber(num)}
                <button 
                  className="absolute -top-1 -right-1 bg-white text-primary rounded-full w-5 h-5 flex items-center justify-center hover:bg-gray-100 transition-colors touch-manipulation shadow-md"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNumberSelect(num);
                  }}
                  aria-label={`Remove ${formatNumber(num)}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
