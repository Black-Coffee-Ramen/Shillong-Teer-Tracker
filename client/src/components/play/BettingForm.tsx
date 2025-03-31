import React, { useState, useCallback, FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface BetData {
  number: number;
  amount: number;
  round: number;
}

interface BettingFormProps {
  selectedNumbers: number[];
  selectedRound: number;
  onResetSelection: () => void;
  onAddToCart: (amount: number) => void;
}

export default function BettingForm({ 
  selectedNumbers, 
  selectedRound, 
  onResetSelection, 
  onAddToCart 
}: BettingFormProps) {
  const [amount, setAmount] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  // Show current selection
  const selectedNumbersText = selectedNumbers.length > 0 
    ? selectedNumbers.sort((a, b) => a - b).join(', ') 
    : 'None';

  const handleAddToCart = useCallback(() => {
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

    onAddToCart(betAmount);
    setAmount('');
    toast({
      title: "Added to Cart",
      description: `${selectedNumbers.length} number(s) added to cart`,
    });
  }, [selectedNumbers, amount, toast, onAddToCart]);

  const handleResetSelection = () => {
    onResetSelection();
    toast({
      title: "Selection Reset",
      description: "Number selection has been cleared",
    });
  };

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
          onClick={handleAddToCart}
          className="flex-1 bg-accent hover:bg-accent/90"
          disabled={selectedNumbers.length === 0}
        >
          Add to Cart
        </Button>
      </div>
    </div>
  );
}