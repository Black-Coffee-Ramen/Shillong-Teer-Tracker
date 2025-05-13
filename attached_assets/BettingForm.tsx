import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useNotification } from "@/hooks/use-notification";
import { cn, formatCurrency, formatTwoDigits } from "@/lib/utils";
import { Result } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useOfflineDB, storeOfflineItem, getOfflineItems } from "@/hooks/use-offline-db";
import { offlineStatus } from "@/components/common/OfflineDetector";
import { WifiOff, Save, CloudOff, ArrowUpRight, RefreshCw } from "lucide-react";

interface BettingFormProps {
  selectedNumbers: number[];
  selectedRound: number;
  onResetSelection: () => void;
}

export default function BettingForm({ selectedNumbers, selectedRound, onResetSelection }: BettingFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addNotification } = useNotification();
  const [amount, setAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState<string>("");
  const { db, isLoading: isDbLoading } = useOfflineDB();
  const [isOffline, setIsOffline] = useState(offlineStatus.isOffline);
  const [pendingBets, setPendingBets] = useState<number>(0);
  
  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    // Update from global status object
    setIsOffline(offlineStatus.isOffline);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Check for pending bets on component mount
  useEffect(() => {
    const checkPendingBets = async () => {
      if (!db) return;
      
      try {
        const offlineBets = await getOfflineItems(db, 'offline-bets');
        setPendingBets(offlineBets.length);
      } catch (error) {
        console.error('Error checking pending bets:', error);
      }
    };
    
    checkPendingBets();
    
    // Set up an interval to periodically check for pending bets
    const interval = setInterval(() => {
      checkPendingBets();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [db, offlineStatus.pendingSyncItems]);
  
  // Fetch today's results to check for wins/near-misses
  const { data: results } = useQuery<Result[]>({
    queryKey: ["/api/results"],
  });
  
  // Find today's result
  const todayResult = results?.find(result => {
    const resultDate = new Date(result.date);
    const today = new Date();
    return resultDate.toDateString() === today.toDateString();
  });
  
  // Check for wins and near-misses after placing bets
  const checkForWinOrNearMiss = (betNumber: number) => {
    if (!todayResult) return;
    
    // Get the result number for the selected round
    const resultNumber = selectedRound === 1 ? todayResult.round1 : todayResult.round2;
    
    // If the result is not available yet, return early
    if (resultNumber === null || resultNumber === undefined) return;
    
    // Check for exact match (win)
    if (betNumber === resultNumber) {
      const winAmount = amount * 80; // 80x multiplier
      addNotification(
        `🎉 You won ${formatCurrency(winAmount)}! Your number ${formatTwoDigits(betNumber)} matched today's Round ${selectedRound} result.`,
        "win"
      );
      return;
    }
    
    // Check for near miss (1 digit difference)
    const betDigits = [Math.floor(betNumber / 10), betNumber % 10];
    const resultDigits = [Math.floor(resultNumber / 10), resultNumber % 10];
    
    // Check if only one digit is different, and the difference is 1
    const firstDigitDiff = Math.abs(betDigits[0] - resultDigits[0]);
    const secondDigitDiff = Math.abs(betDigits[1] - resultDigits[1]);
    
    if ((firstDigitDiff === 1 && secondDigitDiff === 0) || 
        (firstDigitDiff === 0 && secondDigitDiff === 1)) {
      addNotification(
        `😲 So close! Your number ${formatTwoDigits(betNumber)} was just 1 digit away from the winning number ${formatTwoDigits(resultNumber)}.`,
        "near-miss"
      );
    }
  };
  
  // Function to trigger manual sync with service worker
  const triggerSync = () => {
    if (!navigator.onLine) return;
    
    addNotification('Synchronizing offline bets...', 'info');
    
    // Send message to service worker to trigger sync
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SYNC_NOW'
      });
    }
  };
  
  const placeBetMutation = useMutation({
    mutationFn: async (betData: { number: number; amount: number; round: number }) => {
      const res = await apiRequest("POST", "/api/bets", betData);
      return res.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Bet placed successfully!",
        description: `You've placed a bet of ${formatCurrency(amount)} on ${selectedNumbers.length} numbers.`,
      });
      
      // Check if we won or had a near miss with the number we just bet on
      checkForWinOrNearMiss(variables.number);
      
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
  
  const handlePlaceBet = async () => {
    if (selectedNumbers.length === 0 || amount <= 0) {
      return;
    }
    
    // If offline, store bets in IndexedDB
    if (isOffline && db) {
      try {
        const now = new Date();
        const storedBets = [];
        
        for (const number of selectedNumbers) {
          const offlineBet = {
            id: `offline-bet-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            userId: user?.id || 0,
            number,
            amount,
            round: selectedRound,
            createdAt: now.toISOString(),
            status: 'pending',
            syncStatus: 'not_synced'
          };
          
          await storeOfflineItem(db, 'offline-bets', offlineBet);
          storedBets.push(offlineBet);
        }
        
        // Update pending bets count
        setPendingBets(prev => prev + selectedNumbers.length);
        offlineStatus.pendingSyncItems += selectedNumbers.length;
        
        toast({
          title: "Offline bet stored",
          description: `Your bet on ${selectedNumbers.length} numbers has been saved and will be placed when you're back online.`,
        });
        
        onResetSelection();
        setAmount(0);
        setCustomAmount("");
      } catch (error) {
        toast({
          title: "Failed to store offline bet",
          description: error instanceof Error ? error.message : String(error),
          variant: "destructive",
        });
      }
      return;
    }
    
    // Online mode: Place a bet for each selected number
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
      {isOffline && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-5 flex items-center">
          <div className="bg-amber-100 p-2 rounded-md mr-3">
            <WifiOff className="text-amber-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-gray-800 text-sm font-medium">You are currently offline</p>
            <p className="text-gray-600 text-xs">Your bets will be saved locally and placed when you're back online.</p>
          </div>
        </div>
      )}
      
      {!isOffline && pendingBets > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-5 flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-md mr-3">
              <RefreshCw className="text-blue-600 h-5 w-5" />
            </div>
            <div>
              <p className="text-gray-800 text-sm font-medium">
                {pendingBets} offline {pendingBets === 1 ? 'bet' : 'bets'} pending
              </p>
              <p className="text-gray-600 text-xs">These will be synchronized automatically</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs bg-white border-blue-300 text-blue-700 hover:bg-blue-50"
            onClick={triggerSync}
          >
            Sync Now
          </Button>
        </div>
      )}
      
      <div className="card-modern p-5 mb-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="section-title">Betting Amount</h3>
          {isOffline && (
            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
              <WifiOff className="h-3 w-3 mr-1" /> Offline Mode
            </Badge>
          )}
        </div>
        
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
              {formatCurrency(predefinedAmount)}
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
        
        <div className="grid grid-cols-2 gap-4 mb-2">
          <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
            <p className="text-gray-500 text-xs mb-1">Total Bet Amount</p>
            <p className="text-gray-900 font-medium">{formatCurrency(totalBetAmount)}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
            <p className="text-blue-600 text-xs mb-1">Potential Winning</p>
            <p className="text-gray-900 font-medium">{formatCurrency(potentialWinning)}</p>
          </div>
        </div>
      </div>
      
      <Button
        onClick={handlePlaceBet}
        disabled={!canPlaceBet}
        className={cn(
          "w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-md font-medium flex items-center justify-center mb-6 h-12",
          !canPlaceBet && "opacity-50 cursor-not-allowed"
        )}
      >
        {placeBetMutation.isPending ? (
          <>
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Placing Bet...
          </>
        ) : isOffline ? (
          <>
            <Save className="mr-2 h-4 w-4" />
            Save Bet Offline
          </>
        ) : (
          <>
            <ArrowUpRight className="mr-2 h-4 w-4" />
            Place Bet Now
          </>
        )}
      </Button>
      
      {/* AI Suggestions */}
      <div className="card-modern p-5 mb-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="section-title flex items-center">
            <span className="bg-primary/10 text-primary font-bold text-xs rounded-md px-1.5 py-0.5 mr-2">AI</span>
            Smart Predictions
          </h3>
          <button className="text-primary text-sm font-medium flex items-center">
            Refresh <RefreshCw className="ml-1 h-3 w-3" />
          </button>
        </div>
        
        <div className="bg-gray-50 rounded-md p-4 border border-gray-100">
          <p className="text-gray-700 text-sm leading-relaxed">
            Based on the last 7 days, numbers ending with <span className="text-primary font-medium">3, 7, 8</span> appeared more frequently in Round {selectedRound}. Consider including them in your selection.
          </p>
        </div>
      </div>
    </>
  );
}
