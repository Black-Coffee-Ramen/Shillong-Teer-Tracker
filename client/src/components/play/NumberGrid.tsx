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
  
  // Create a 10x10 grid where columns are tens and rows are units
  const renderNumberGrid = () => {
    return (
      <div className="w-full mx-auto overflow-hidden">
        <table className="w-full border-collapse">
          <tbody>
            {/* Render rows (0-9 units) */}
            {Array.from({ length: 10 }, (_, row) => (
              <tr key={`row-${row}`}>
                {/* Render columns (0-9 tens) */}
                {Array.from({ length: 10 }, (_, col) => {
                  const num = col * 10 + row;
                  const isSelected = selectedNumbers.includes(num);
                  const isPreviouslyBet = previouslyBetNumbers.includes(num);
                  
                  return (
                    <td 
                      key={`cell-${row}-${col}`}
                      className="p-0 m-0"
                      style={{ width: '10%', padding: 0 }}
                    >
                      <button
                        onClick={() => onNumberSelect(num)}
                        className={cn(
                          "betting-number relative w-full bg-gray-800 hover:bg-gray-700 text-white rounded-md py-1.5 flex items-center justify-center font-mono transition-all",
                          isSelected && "bg-orange-600 hover:bg-orange-700 border-2 border-orange-400",
                          isPreviouslyBet && !isSelected && "border-2 border-green-500"
                        )}
                        style={{ width: '100%', height: '36px', minWidth: '30px' }}
                      >
                        <span>{formatNumber(num)}</span>
                        {isPreviouslyBet && !isSelected && (
                          <span className="absolute -top-1 -right-1 bg-green-500 rounded-full w-2 h-2"></span>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  return (
    <div className="bg-secondary rounded-xl p-4 mb-4 shadow-md">
      <h2 className="text-white font-poppins font-semibold mb-3">Select Your Number</h2>
      
      <div className="mb-4 overflow-x-auto">
        {renderNumberGrid()}
      </div>
      
      {/* Key for indicators */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-orange-600 border-2 border-orange-400 rounded-sm mr-2"></div>
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
              <div key={num} className="bg-orange-600 border-2 border-orange-400 rounded-full px-3 py-1 text-white text-sm font-mono flex items-center">
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
