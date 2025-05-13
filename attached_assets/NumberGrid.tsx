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
    <div className="card-modern p-5 mb-5">
      <h3 className="section-title mb-4">Select Your Number</h3>
      
      <div className="mb-4 overflow-hidden">
        <div className="flex justify-between items-center mb-3">
          <div className="flex -space-x-2">
            {selectedNumbers.slice(0, 3).map(num => (
              <div key={num} className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-medium border-2 border-white">
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
        
        <div className="grid grid-cols-10 gap-1.5">
          {Array.from({ length: 100 }, (_, i) => i).map(num => (
            <button
              key={num}
              onClick={() => onNumberSelect(num)}
              className={cn(
                "w-8 h-8 text-sm rounded flex items-center justify-center transition-colors",
                selectedNumbers.includes(num) 
                  ? "bg-primary text-white hover:bg-primary/90" 
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              )}
            >
              {num}
            </button>
          ))}
        </div>
      </div>
      
      {/* Selected Numbers */}
      {selectedNumbers.length > 0 && (
        <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
          <p className="text-gray-700 text-sm font-medium mb-2">Selected Numbers:</p>
          <div className="flex flex-wrap gap-2">
            {selectedNumbers.map(num => (
              <div key={num} className="bg-white border border-gray-200 rounded-md px-2 py-1 text-sm flex items-center">
                {formatNumber(num)}
                <button 
                  className="ml-2 text-gray-400 hover:text-red-500"
                  onClick={() => onNumberSelect(num)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
