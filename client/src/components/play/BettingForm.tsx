import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function BettingForm({ onBetPlaced }) {
  const [number, setNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [round, setRound] = useState(1);
  const { user } = useAuth();

  const placeBetMutation = useMutation({
    mutationFn: async (betData) => {
      const response = await fetch('/api/bets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(betData)
      });
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || 'Failed to place bet';
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: () => {
      setNumber('');
      setAmount('');
      onBetPlaced();
      toast.success('Bet placed successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to place bet');
    }
  });

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to place bets');
      return;
    }

    const betAmount = parseInt(amount);
    const betNumber = parseInt(number);

    if (isNaN(betAmount) || betAmount < 5) {
      toast.error('Minimum bet amount is 5');
      return;
    }

    if (isNaN(betNumber) || betNumber < 0 || betNumber > 99) {
      toast.error('Please enter a valid number between 0 and 99');
      return;
    }

    placeBetMutation.mutate({
      number: betNumber,
      amount: betAmount,
      round
    });
  }, [number, amount, round, user, placeBetMutation, onBetPlaced]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Bet Number (0-99)</label>
        <input
          type="number"
          min="0"
          max="99"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Amount (min. 5)</label>
        <input
          type="number"
          min="5"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Round</label>
        <select
          value={round}
          onChange={(e) => setRound(parseInt(e.target.value))}
          className="w-full p-2 border rounded"
        >
          <option value={1}>Round 1</option>
          <option value={2}>Round 2</option>
        </select>
      </div>

      <Button
        type="submit"
        disabled={placeBetMutation.isPending}
        className="w-full"
      >
        {placeBetMutation.isPending ? 'Placing Bet...' : 'Place Bet'}
      </Button>
    </form>
  );
}