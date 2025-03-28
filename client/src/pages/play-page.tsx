import { useState } from "react";
import { cn } from "@/lib/utils";
import NumberGrid from "@/components/play/NumberGrid";
import BettingForm from "@/components/play/BettingForm";

export default function PlayPage() {
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  
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
      
      {/* Countdown Timer */}
      <div className="bg-secondary rounded-xl p-4 mb-4 shadow-md">
        <div className="flex justify-between items-center">
          <p className="text-white">Round closes in:</p>
          <div className="font-mono font-medium text-accent text-xl" id="play-countdown">
            {selectedRound === 1 ? "02:45:16" : "03:45:16"}
          </div>
        </div>
      </div>
      
      {/* Number Selection Grid */}
      <NumberGrid 
        onNumberSelect={handleNumberSelect}
        selectedNumbers={selectedNumbers}
      />
      
      {/* Betting Form */}
      <BettingForm 
        selectedNumbers={selectedNumbers}
        selectedRound={selectedRound}
        onResetSelection={resetSelection}
      />
    </div>
  );
}
