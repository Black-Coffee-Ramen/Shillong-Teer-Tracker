import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface NumberGridProps {
  onNumberSelect: (num: number) => void;
  selectedNumbers: number[];
}

export default function NumberGrid({ onNumberSelect, selectedNumbers }: NumberGridProps) {
  const formatNumber = (num: number): string => {
    return num < 10 ? `0${num}` : `${num}`;
  };
  
  return (
    <div className="bg-secondary rounded-xl p-4 mb-4 shadow-md">
      <h2 className="text-white font-poppins font-semibold mb-3">Select Your Number</h2>
      
      <div className="grid grid-cols-5 gap-2 mb-4">
        {Array.from({ length: 100 }, (_, i) => i).map(num => (
          <button
            key={num}
            onClick={() => onNumberSelect(num)}
            className={cn(
              "betting-number bg-gray-800 hover:bg-gray-700 text-white rounded-md py-2 flex items-center justify-center font-mono transition-all",
              selectedNumbers.includes(num) && "bg-accent hover:bg-accent/90"
            )}
          >
            <span>{formatNumber(num)}</span>
          </button>
        ))}
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
                  onClick={() => onNumberSelect(num)}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
