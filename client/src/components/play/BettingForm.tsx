import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BettingFormProps {
  selectedNumbers: number[];
  selectedRound: number;
  onResetSelection: () => void;
}

export default function BettingForm({ selectedNumbers, selectedRound, onResetSelection }: BettingFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState<string>("");
  
  const placeBetMutation = useMutation({
    mutationFn: async (betData: { number: number; amount: number; round: number }) => {
      const res = await apiRequest("POST", "/api/bets", betData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Bet placed successfully!",
        description: `You've placed a bet of ${formatCurrency(amount)} on ${selectedNumbers.length} numbers.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      onResetSelection();
      setAmount(0);
      setCustomAmount("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to place bet",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const predefinedAmounts = [5, 10, 20, 50];
  
  const handleAmountSelect = (selectedAmount: number) => {
    setAmount(selectedAmount);
    setCustomAmount("");
  };
  
  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomAmount(value);
    setAmount(parseInt(value) || 0);
  };
  
  const totalBetAmount = selectedNumbers.length * amount;
  const potentialWinning = totalBetAmount * 80; // 80x multiplier
  
  const handlePlaceBet = () => {
    if (selectedNumbers.length === 0 || amount <= 0) {
      return;
    }
    
    // Place a bet for each selected number
    selectedNumbers.forEach(number => {
      placeBetMutation.mutate({
        number,
        amount,
        round: selectedRound
      });
    });
  };
  
  const canPlaceBet = selectedNumbers.length > 0 && amount >= 5 && !(placeBetMutation.isPending);
  
  return (
    <>
      <div className="bg-secondary rounded-xl p-4 mb-4 shadow-md">
        <h2 className="text-white font-poppins font-semibold mb-3">Betting Amount</h2>
        
        <div className="grid grid-cols-4 gap-2 mb-3">
          {predefinedAmounts.map(predefinedAmount => (
            <button
              key={predefinedAmount}
              onClick={() => handleAmountSelect(predefinedAmount)}
              className={cn(
                "bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-md font-mono",
                amount === predefinedAmount && "bg-accent hover:bg-accent/90"
              )}
            >
              {formatCurrency(predefinedAmount)}
            </button>
          ))}
        </div>
        
        <div className="flex items-center mt-4">
          <p className="text-gray-400 text-sm mr-3">Custom Amount:</p>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
            <Input
              type="number"
              value={customAmount}
              onChange={handleCustomAmountChange}
              className="w-full bg-gray-800 text-white py-2 pl-8 pr-3 rounded-md font-mono"
              placeholder="Enter amount"
              min="5"
              max="10000"
            />
          </div>
        </div>
        
        <div className="flex justify-between mt-4 bg-gray-800 p-3 rounded-lg">
          <div>
            <p className="text-gray-400 text-sm">Potential Winning:</p>
            <p className="text-white font-mono">{formatCurrency(potentialWinning)}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm">Total Bet Amount:</p>
            <p className="text-white font-mono">{formatCurrency(totalBetAmount)}</p>
          </div>
        </div>
      </div>
      
      <Button
        onClick={handlePlaceBet}
        disabled={!canPlaceBet}
        className={cn(
          "w-full bg-accent hover:bg-accent/90 text-white py-3 rounded-lg font-poppins font-semibold flex items-center justify-center mb-6",
          !canPlaceBet && "opacity-50 cursor-not-allowed"
        )}
      >
        {placeBetMutation.isPending ? (
          <>
            <i className="ri-loader-4-line animate-spin mr-2"></i>
            Placing Bet...
          </>
        ) : (
          "Place Bet"
        )}
      </Button>
      
      {/* AI Suggestions */}
      <div className="bg-secondary rounded-xl p-4 mb-6 shadow-md">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-white font-poppins font-semibold flex items-center">
            <i className="ri-ai-generate text-accent mr-2"></i>
            AI Analysis
          </h2>
          <button className="text-accent text-sm flex items-center">
            Refresh <i className="ri-refresh-line ml-1"></i>
          </button>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-gray-300 text-sm">
            Based on the last 7 days, numbers ending with <span className="text-accent">3, 7, 8</span> appeared more frequently in Round {selectedRound}. Consider including them in your selection.
          </p>
        </div>
      </div>
    </>
  );
}
