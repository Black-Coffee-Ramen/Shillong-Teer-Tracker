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
    <div className="bg-white rounded-lg p-5 mb-5 shadow-sm border border-gray-100">
      <h3 className="text-gray-800 font-semibold mb-4 text-lg">Select Your Number</h3>
      
      <div className="mb-4 overflow-hidden">
        {/* Selected indicators */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex -space-x-2">
            {selectedNumbers.slice(0, 3).map(num => (
              <div key={`indicator-${num}`} className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-medium border-2 border-white">
                {num}
              </div>
            ))}
            {selectedNumbers.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 text-xs flex items-center justify-center font-medium border-2 border-white">
                +{selectedNumbers.length - 3}
              </div>
            )}
          </div>
          
          <div className="text-sm text-gray-500">
            {selectedNumbers.length} selected
          </div>
        </div>
        
        {/* Modern grid with the pattern 00,10,20... in rows */}
        <div className="grid grid-cols-10 gap-1.5">
          {Array.from({ length: 10 }, (_, row) => (
            // For each row, create 10 columns (0-9) with the pattern
            Array.from({ length: 10 }, (_, col) => {
              // Calculate the number based on row and column
              const num = row + (col * 10);
              // Check if selected or previously bet
              const isSelected = selectedNumbers.includes(num);
              const isPreviouslyBet = previouslyBetNumbers.includes(num);
              
              return (
                <button
                  key={num}
                  onClick={() => onNumberSelect(num)}
                  className={cn(
                    "w-8 h-8 text-sm rounded flex items-center justify-center transition-colors relative",
                    isSelected 
                      ? "bg-purple-700 text-white hover:bg-purple-800" 
                      : isPreviouslyBet
                        ? "bg-gray-100 text-gray-800 hover:bg-gray-200 border border-purple-300"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  )}
                >
                  {formatNumber(num)}
                  {isPreviouslyBet && !isSelected && (
                    <span className="absolute -top-1 -right-1 bg-purple-500 rounded-full w-1.5 h-1.5"></span>
                  )}
                </button>
              );
            })
          )).flat()
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-6 mb-4 bg-gray-50 p-2 rounded-md">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-primary rounded-sm mr-2"></div>
          <span className="text-gray-600 text-xs">Selected</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-100 border border-primary/30 rounded-sm mr-2 relative">
            <span className="absolute -top-0.5 -right-0.5 bg-primary/60 rounded-full w-1.5 h-1.5"></span>
          </div>
          <span className="text-gray-600 text-xs">Previously Bet</span>
        </div>
      </div>
      
      {/* Selected Numbers */}
      <div className="mb-4 bg-gray-50 rounded-md p-3 border border-gray-100">
        <p className="text-gray-700 text-sm font-medium mb-2">Selected Numbers:</p>
        <div className="flex flex-wrap gap-2">
          {selectedNumbers.length === 0 ? (
            <div className="text-gray-400 text-sm italic">No numbers selected yet</div>
          ) : (
            selectedNumbers.map(num => (
              <div key={num} className="bg-white border border-gray-200 rounded-md px-2 py-1 text-sm flex items-center">
                {formatNumber(num)}
                <button 
                  className="ml-2 text-gray-400 hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent the grid button from being clicked
                    onNumberSelect(num);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
          <p className="text-gray-700 text-sm font-medium mb-2">Your Previously Bet Numbers:</p>
          <div className="flex flex-wrap gap-2">
            {previouslyBetNumbers.map(num => (
              <div key={`prev-${num}`} className="bg-white border border-gray-200 border-primary/20 rounded-md px-2 py-1 text-sm text-gray-600">
                {formatNumber(num)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
