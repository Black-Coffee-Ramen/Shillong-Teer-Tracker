import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, AlarmClock, AlertCircle, CheckCircle, Calendar } from "lucide-react";

interface BettingStatus {
  currentTime: string;
  today: string;
  round1: {
    isOpen: boolean;
    message: string;
    cutoffTime: string;
  };
  round2: {
    isOpen: boolean;
    message: string;
    cutoffTime: string;
  };
  isSunday: boolean;
}

export function BettingInterface() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [betNumber, setBetNumber] = useState<string>("");
  const [betAmount, setBetAmount] = useState<string>("100");
  const [countdown, setCountdown] = useState<string>("--:--:--");
  const [bettingDate, setBettingDate] = useState<string>("");

  // Fetch betting status
  const { data: bettingStatus, isLoading: isLoadingStatus, error: statusError } = 
    useQuery<BettingStatus>({
      queryKey: ["/api/betting/status"],
      refetchInterval: 30000, // Refresh every 30 seconds
    });

  // Set up countdown timer
  useEffect(() => {
    if (!bettingStatus) return;

    const updateCountdown = () => {
      const now = new Date();
      
      // Get target time based on selected round
      const targetHour = selectedRound === 1 ? 15 : 16;
      const targetMinute = 30;
      
      // Create target date
      const target = new Date(now);
      target.setHours(targetHour, targetMinute, 0, 0);
      
      // If target time has passed, set target to tomorrow
      if (now >= target) {
        target.setDate(target.getDate() + 1);
      }
      
      // Calculate time difference
      const diff = target.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    // Format betting date
    const now = new Date();
    const isRoundClosed = selectedRound === 1 
      ? !bettingStatus.round1.isOpen 
      : !bettingStatus.round2.isOpen;
    
    if (isRoundClosed) {
      // If betting is closed for today, we're betting for tomorrow
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      setBettingDate(`${tomorrow.getDate().toString().padStart(2, '0')}/${(tomorrow.getMonth() + 1).toString().padStart(2, '0')}/${tomorrow.getFullYear()}`);
    } else {
      // Otherwise we're betting for today
      setBettingDate(`${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`);
    }
    
    return () => clearInterval(interval);
  }, [bettingStatus, selectedRound]);
  
  // Handle placing a bet
  const placeBetMutation = useMutation({
    mutationFn: async (data: { number: number; amount: number; round: number }) => {
      const res = await apiRequest("POST", "/api/betting/place", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Bet placed successfully",
        description: `You placed a bet on number ${betNumber} for Round ${selectedRound}`,
        variant: "default",
      });
      
      // Clear the form
      setBetNumber("");
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/betting/history"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to place bet",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handlePlaceBet = () => {
    // Validate input
    if (!betNumber || isNaN(parseInt(betNumber)) || parseInt(betNumber) < 0 || parseInt(betNumber) > 99) {
      toast({
        title: "Invalid number",
        description: "Please enter a valid number between 0 and 99",
        variant: "destructive",
      });
      return;
    }
    
    if (!betAmount || isNaN(parseInt(betAmount)) || parseInt(betAmount) < 10) {
      toast({
        title: "Invalid amount",
        description: "Minimum bet amount is 10",
        variant: "destructive",
      });
      return;
    }
    
    // Place bet
    placeBetMutation.mutate({
      number: parseInt(betNumber),
      amount: parseInt(betAmount),
      round: selectedRound,
    });
  };
  
  // Check if betting is closed
  const isBettingClosed = () => {
    if (!bettingStatus) return true;
    
    if (bettingStatus.isSunday) return true;
    
    return selectedRound === 1 
      ? !bettingStatus.round1.isOpen 
      : !bettingStatus.round2.isOpen;
  };
  
  // Get status message
  const getStatusMessage = () => {
    if (!bettingStatus) return "Loading...";
    
    if (bettingStatus.isSunday) {
      return "Betting closed. Shillong Teer does not operate on Sundays.";
    }
    
    return selectedRound === 1 
      ? bettingStatus.round1.message 
      : bettingStatus.round2.message;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Place Your Bet</CardTitle>
        <CardDescription>Select number, amount and round to place your bet</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Round Selection */}
        <div className="space-y-2">
          <Label>Select Round</Label>
          <div className="flex gap-4">
            <Button
              type="button"
              variant={selectedRound === 1 ? "default" : "outline"}
              onClick={() => setSelectedRound(1)}
              className="flex-1"
            >
              Round 1 (15:30)
            </Button>
            <Button
              type="button"
              variant={selectedRound === 2 ? "default" : "outline"}
              onClick={() => setSelectedRound(2)}
              className="flex-1"
            >
              Round 2 (16:30)
            </Button>
          </div>
        </div>
        
        {/* Countdown Timer */}
        <div className="rounded-md border p-4">
          <div className="flex flex-col items-center space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="mr-1 h-4 w-4" />
              <span>
                Round {selectedRound} – Betting for: {bettingDate || "..."}
              </span>
            </div>
            
            <div className="text-2xl font-mono font-bold">
              {countdown}
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              {isLoadingStatus ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isBettingClosed() ? (
                <AlertCircle className="h-4 w-4 text-destructive" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              <span className={isBettingClosed() ? "text-destructive" : "text-green-500"}>
                {getStatusMessage()}
              </span>
            </div>
          </div>
        </div>
        
        {/* Betting Form */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="number">Enter Number (0-99)</Label>
            <Input
              id="number"
              type="number"
              min="0"
              max="99"
              value={betNumber}
              onChange={(e) => setBetNumber(e.target.value)}
              placeholder="Enter a number between 0-99"
              disabled={isBettingClosed() || !user || placeBetMutation.isPending}
            />
          </div>
          
          <div>
            <Label htmlFor="amount">Bet Amount</Label>
            <Input
              id="amount"
              type="number"
              min="10"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder="Minimum bet: 10"
              disabled={isBettingClosed() || !user || placeBetMutation.isPending}
            />
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col gap-4">
        <Button 
          className="w-full" 
          onClick={handlePlaceBet}
          disabled={isBettingClosed() || !user || !betNumber || !betAmount || placeBetMutation.isPending}
        >
          {placeBetMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Placing Bet...
            </>
          ) : (
            <>Place Bet</>
          )}
        </Button>
        
        {!user && (
          <div className="text-sm text-destructive text-center">
            You need to log in to place bets
          </div>
        )}
      </CardFooter>
    </Card>
  );
}