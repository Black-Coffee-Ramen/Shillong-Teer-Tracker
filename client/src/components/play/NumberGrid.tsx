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
      const betNumbers = bets.map(bet => bet.number);
      // Remove duplicates
      const uniqueBetNumbers = [...new Set(betNumbers)];
      setPreviouslyBetNumbers(uniqueBetNumbers);
    }
  }, [bets]);
  
  const formatNumber = (num: number): string => {
    return num < 10 ? `0${num}` : `${num}`;
  };
  
  return (
    <div className="bg-secondary rounded-xl p-4 mb-4 shadow-md">
      <h2 className="text-white font-poppins font-semibold mb-3">Select Your Number</h2>
      
      <div className="grid grid-cols-5 gap-2 mb-4">
        {Array.from({ length: 100 }, (_, i) => i).map(num => {
          const isSelected = selectedNumbers.includes(num);
          const isPreviouslyBet = previouslyBetNumbers.includes(num);
          
          return (
            <button
              key={num}
              onClick={() => onNumberSelect(num)}
              className={cn(
                "betting-number relative bg-gray-800 hover:bg-gray-700 text-white rounded-md py-2 flex items-center justify-center font-mono transition-all",
                isSelected && "bg-accent hover:bg-accent/90",
                isPreviouslyBet && !isSelected && "border-2 border-green-500"
              )}
            >
              <span>{formatNumber(num)}</span>
              {isPreviouslyBet && !isSelected && (
                <span className="absolute -top-1 -right-1 bg-green-500 rounded-full w-3 h-3"></span>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Key for indicators */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-accent rounded-sm mr-2"></div>
          <span className="text-white text-xs">Selected</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-800 border-2 border-green-500 rounded-sm mr-2"></div>
          <span className="text-white text-xs">Previously Bet</span>
        </div>
      </div>
      
      {/* Selected Numbers */}
      <div className="mt-4 mb-2">
        <p className="text-white text-sm mb-2">Selected Numbers:</p>
        <div className="flex flex-wrap gap-2">
          {selectedNumbers.length === 0 ? (
            <div className="text-white text-sm italic">No numbers selected yet</div>
          ) : (
            selectedNumbers.map(num => (
              <div key={num} className="bg-accent rounded-full px-3 py-1 text-white text-sm font-mono flex items-center">
                {formatNumber(num)}
                <button 
                  className="ml-2 text-white text-xs"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent the grid button from being clicked
                    onNumberSelect(num);
                  }}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Previously Bet Numbers */}
      {previouslyBetNumbers.length > 0 && (
        <div className="mt-4">
          <p className="text-white text-sm mb-2">Your Previously Bet Numbers:</p>
          <div className="flex flex-wrap gap-2">
            {previouslyBetNumbers.map(num => (
              <div key={`prev-${num}`} className="bg-gray-700 border border-green-500 rounded-full px-3 py-1 text-white text-sm font-mono">
                {formatNumber(num)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
