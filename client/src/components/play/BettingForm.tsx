import React, { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { ArrowUpRight } from 'lucide-react';

interface BetData {
  number: number;
  amount: number;
  round: number;
}

interface BettingFormProps {
  selectedNumbers: number[];
  selectedRound: number;
  onResetSelection: () => void;
}

export default function BettingForm({ 
  selectedNumbers, 
  selectedRound, 
  onResetSelection
}: BettingFormProps) {
  const [amount, setAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState<string>('');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create a mutation for placing bets directly
  const placeBetMutation = useMutation({
    mutationFn: async (betData: BetData) => {
      return await apiRequest('POST', '/api/bets', betData);
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bets'] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to place bet",
      });
    }
  });

  const handlePlaceBet = useCallback(() => {
    if (selectedNumbers.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select at least one number",
      });
      return;
    }

    if (amount < 5) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Minimum bet amount is 5",
      });
      return;
    }

    // Place a bet for each selected number
    let successCount = 0;
    const totalNumbers = selectedNumbers.length;

    selectedNumbers.forEach((number, index) => {
      placeBetMutation.mutate(
        {
          number,
          amount,
          round: selectedRound
        },
        {
          onSuccess: () => {
            successCount++;
            if (index === totalNumbers - 1) {
              // Last bet placed
              toast({
                title: "Bets Placed",
                description: `Successfully placed ${successCount} out of ${totalNumbers} bets`,
              });
              setAmount(0);
              setCustomAmount('');
              onResetSelection();
            }
          }
        }
      );
    });
  }, [selectedNumbers, amount, selectedRound, toast, placeBetMutation, onResetSelection]);

  const handleResetSelection = () => {
    onResetSelection();
    toast({
      title: "Selection Reset",
      description: "Number selection has been cleared",
    });
  };

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
  const potentialWinnings = totalBetAmount * 80; // 80x multiplier
  
  const canPlaceBet = selectedNumbers.length > 0 && amount >= 5 && !placeBetMutation.isPending;

  return (
    <div className="bg-white rounded-lg p-5 mb-5 shadow-sm border border-gray-100">
      <h3 className="text-gray-800 font-semibold mb-4 text-lg">Place Your Bet</h3>
      
      <div className="mb-5">
        <div className="text-gray-700 mb-2 text-sm font-medium">Selected Numbers:</div>
        <div className="bg-gray-50 p-3 rounded-md border border-gray-100 min-h-[48px] flex flex-wrap gap-2">
          {selectedNumbers.length === 0 ? (
            <div className="text-gray-400 text-sm italic">No numbers selected yet</div>
          ) : (
            selectedNumbers.sort((a, b) => a - b).map(num => (
              <div key={num} className="bg-white border border-gray-200 rounded-md px-2 py-1 text-sm flex items-center">
                {num < 10 ? `0${num}` : num}
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="mb-5">
        <h4 className="text-gray-700 mb-3 text-sm font-medium">Betting Amount</h4>
        
        <div className="grid grid-cols-4 gap-2 mb-4">
          {predefinedAmounts.map(predefinedAmount => (
            <button
              key={predefinedAmount}
              onClick={() => handleAmountSelect(predefinedAmount)}
              className={cn(
                "py-2 rounded-md text-sm font-medium transition-colors",
                amount === predefinedAmount 
                  ? "bg-primary text-white" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              ₹{predefinedAmount}
            </button>
          ))}
        </div>
        
        <div className="flex items-center mb-5">
          <p className="text-gray-700 text-sm font-medium mr-3 whitespace-nowrap">Custom:</p>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
            <Input
              type="number"
              value={customAmount}
              onChange={handleCustomAmountChange}
              className="w-full bg-white border-gray-200 py-2 pl-8 pr-3 rounded-md"
              placeholder="Enter amount"
              min="5"
              max="10000"
            />
          </div>
        </div>
      </div>
      
      <div className="mb-5">
        <div className="text-gray-700 mb-2 text-sm font-medium">Selected Round:</div>
        <div className="bg-gray-50 p-3 rounded-md border border-gray-100 font-medium flex items-center justify-between">
          <span className="text-gray-800">Round {selectedRound}</span>
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
            {selectedRound === 1 ? '15:30' : '16:30'} IST
          </span>
        </div>
      </div>

      {/* Display summary before placing bet */}
      {selectedNumbers.length > 0 && amount >= 5 && (
        <div className="mb-5 bg-gray-50 p-4 rounded-md border border-gray-100">
          <h4 className="text-gray-800 font-medium mb-3 text-sm">Bet Summary</h4>
          <div className="flex justify-between mb-2 py-2 border-b border-gray-200">
            <span className="text-gray-600">Numbers selected:</span>
            <span className="text-gray-800 font-medium">{selectedNumbers.length}</span>
          </div>
          <div className="flex justify-between mb-2 py-2 border-b border-gray-200">
            <span className="text-gray-600">Amount per number:</span>
            <span className="text-gray-800 font-medium">₹{amount}</span>
          </div>
          <div className="flex justify-between mb-2 py-2 border-b border-gray-200">
            <span className="text-gray-600">Total bet amount:</span>
            <span className="text-gray-800 font-medium">₹{totalBetAmount}</span>
          </div>
          <div className="flex justify-between py-2 text-lg">
            <span className="text-gray-800">Potential winnings:</span>
            <span className="text-primary font-bold">₹{potentialWinnings}</span>
          </div>
        </div>
      )}
      
      <div className="flex space-x-4">
        <Button
          type="button"
          onClick={handleResetSelection}
          variant="outline"
          className="flex-1 h-12 border-gray-300 text-gray-700 hover:bg-gray-50 bg-white"
        >
          Reset
        </Button>
        <Button
          type="button"
          onClick={handlePlaceBet}
          className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white"
          disabled={!canPlaceBet}
        >
          {placeBetMutation.isPending ? (
            <span className="flex items-center justify-center">
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Placing Bet...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Place Bet Now
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}