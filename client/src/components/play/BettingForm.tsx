import React, { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

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
  const [amount, setAmount] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Show current selection
  const selectedNumbersText = selectedNumbers.length > 0 
    ? selectedNumbers.sort((a, b) => a - b).join(', ') 
    : 'None';

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

    const betAmount = parseInt(amount);
    if (isNaN(betAmount) || betAmount < 5) {
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
          amount: betAmount,
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
              setAmount('');
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

  const totalBetAmount = selectedNumbers.length * parseInt(amount || '0');
  const potentialWinnings = totalBetAmount * 80; // 80x multiplier

  return (
    <div className="bg-gray-800 rounded-xl p-4 mb-8 shadow-md">
      <h3 className="text-lg font-medium mb-3 text-white">Place Your Bet</h3>
      
      <div className="mb-4">
        <div className="text-gray-300 mb-1 text-sm">Selected Numbers:</div>
        <div className="bg-gray-700 p-2 rounded-md text-accent font-medium min-h-[36px]">
          {selectedNumbersText}
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-gray-300 mb-1 text-sm">Bet Amount Per Number (min. 5)</label>
        <input
          type="number"
          min="5"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2 border border-gray-600 bg-gray-700 text-white rounded-md"
          placeholder="Enter amount"
        />
      </div>
      
      <div className="mb-4">
        <div className="text-gray-300 mb-1 text-sm">Selected Round:</div>
        <div className="bg-gray-700 p-2 rounded-md text-accent font-medium">
          Round {selectedRound} ({selectedRound === 1 ? '15:30' : '16:30'} IST)
        </div>
      </div>

      {/* Display summary before placing bet */}
      {selectedNumbers.length > 0 && amount && !isNaN(parseInt(amount)) && (
        <div className="mb-4 p-3 bg-gray-700/50 rounded-lg">
          <div className="flex justify-between mb-1">
            <span className="text-gray-300">Total bet amount:</span>
            <span className="text-white font-medium">{totalBetAmount.toFixed(2)} ₹</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Potential winnings:</span>
            <span className="text-accent font-medium">{potentialWinnings.toFixed(2)} ₹</span>
          </div>
        </div>
      )}
      
      <div className="flex space-x-3">
        <Button
          type="button"
          onClick={handleResetSelection}
          variant="outline"
          className="flex-1"
        >
          Reset
        </Button>
        <Button
          type="button"
          onClick={handlePlaceBet}
          className="flex-1 bg-accent hover:bg-accent/90"
          disabled={selectedNumbers.length === 0 || !amount || isNaN(parseInt(amount)) || placeBetMutation.isPending}
        >
          {placeBetMutation.isPending ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Placing Bet...
            </span>
          ) : "Place Bet"}
        </Button>
      </div>
    </div>
  );
}