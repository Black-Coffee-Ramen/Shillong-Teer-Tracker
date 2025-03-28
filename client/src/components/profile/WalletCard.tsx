import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function WalletCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [depositAmount, setDepositAmount] = useState<number>(500);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(500);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  
  const depositMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await apiRequest("POST", "/api/transactions/deposit", { amount });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Deposit Successful",
        description: `${formatCurrency(depositAmount)} has been added to your wallet.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setIsDepositModalOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Deposit Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const withdrawMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await apiRequest("POST", "/api/transactions/withdraw", { amount });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal Requested",
        description: `Your withdrawal request for ${formatCurrency(withdrawAmount)} has been submitted.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setIsWithdrawModalOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Withdrawal Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleDeposit = () => {
    if (depositAmount < 100) {
      toast({
        title: "Invalid Amount",
        description: "Minimum deposit amount is ₹100",
        variant: "destructive"
      });
      return;
    }
    
    depositMutation.mutate(depositAmount);
  };
  
  const handleWithdraw = () => {
    if (withdrawAmount < 500) {
      toast({
        title: "Invalid Amount",
        description: "Minimum withdrawal amount is ₹500",
        variant: "destructive"
      });
      return;
    }
    
    if (user && withdrawAmount > user.balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough funds for this withdrawal",
        variant: "destructive"
      });
      return;
    }
    
    withdrawMutation.mutate(withdrawAmount);
  };
  
  return (
    <>
      <div className="bg-secondary rounded-xl p-4 mb-6 shadow-md">
        <h2 className="text-white font-poppins font-semibold mb-4">E-Wallet</h2>
        
        <div className="bg-gradient-to-r from-secondary to-gray-800 rounded-lg py-4 px-4 mb-4 flex justify-between items-center">
          <div>
            <p className="text-gray-400 text-sm mb-1">Available Balance</p>
            <p className="font-mono font-bold text-2xl text-white">
              {user ? formatCurrency(user.balance) : "Loading..."}
            </p>
          </div>
          <i className="ri-wallet-3-line text-4xl text-accent opacity-50"></i>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => setIsDepositModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium flex items-center justify-center"
          >
            <i className="ri-add-line mr-1"></i> Deposit
          </Button>
          <Button
            onClick={() => setIsWithdrawModalOpen(true)}
            className="bg-accent hover:bg-accent/90 text-white py-2 rounded-lg font-medium flex items-center justify-center"
            disabled={!user || user.balance < 500}
          >
            <i className="ri-arrow-right-up-line mr-1"></i> Withdraw
          </Button>
        </div>
      </div>
      
      {/* Deposit Modal */}
      <Dialog open={isDepositModalOpen} onOpenChange={setIsDepositModalOpen}>
        <DialogContent className="bg-secondary text-white">
          <DialogHeader>
            <DialogTitle className="text-white font-poppins font-semibold text-lg">Deposit Funds</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add funds to your wallet to place bets.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mb-4">
            <Label className="block text-gray-300 text-sm mb-2">Amount (₹)</Label>
            <Input
              type="number"
              className="w-full bg-gray-800 text-white px-3 py-3 rounded-md font-mono"
              placeholder="Enter amount"
              min="100"
              value={depositAmount}
              onChange={(e) => setDepositAmount(Number(e.target.value))}
            />
            <p className="text-gray-500 text-xs mt-1">Minimum deposit: ₹100</p>
          </div>
          
          <div className="mb-4">
            <Label className="block text-gray-300 text-sm mb-2">Payment Method</Label>
            <div className="grid grid-cols-2 gap-3">
              <label className="bg-gray-800 rounded-md p-3 cursor-pointer flex items-center">
                <input type="radio" name="payment-method" className="mr-2" defaultChecked />
                <div className="flex items-center">
                  <i className="ri-bank-card-line mr-2 text-accent"></i>
                  <span className="text-white text-sm">Card</span>
                </div>
              </label>
              <label className="bg-gray-800 rounded-md p-3 cursor-pointer flex items-center">
                <input type="radio" name="payment-method" className="mr-2" />
                <div className="flex items-center">
                  <i className="ri-bank-line mr-2 text-accent"></i>
                  <span className="text-white text-sm">UPI</span>
                </div>
              </label>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              onClick={handleDeposit}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium mb-3"
              disabled={depositMutation.isPending}
            >
              {depositMutation.isPending ? (
                <>
                  <i className="ri-loader-4-line animate-spin mr-2"></i>
                  Processing...
                </>
              ) : (
                "Proceed to Payment"
              )}
            </Button>
          </DialogFooter>
          <p className="text-gray-500 text-xs text-center">Your funds will be available immediately after successful payment</p>
        </DialogContent>
      </Dialog>
      
      {/* Withdraw Modal */}
      <Dialog open={isWithdrawModalOpen} onOpenChange={setIsWithdrawModalOpen}>
        <DialogContent className="bg-secondary text-white">
          <DialogHeader>
            <DialogTitle className="text-white font-poppins font-semibold text-lg">Withdraw Funds</DialogTitle>
            <DialogDescription className="text-gray-400">
              Withdraw funds from your wallet to your bank account.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mb-4">
            <Label className="block text-gray-300 text-sm mb-2">Amount (₹)</Label>
            <Input
              type="number"
              className="w-full bg-gray-800 text-white px-3 py-3 rounded-md font-mono"
              placeholder="Enter amount"
              min="500"
              max={user?.balance || 0}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(Number(e.target.value))}
            />
            <p className="text-gray-500 text-xs mt-1">Minimum withdrawal: ₹500</p>
          </div>
          
          <div className="mb-4">
            <Label className="block text-gray-300 text-sm mb-2">Withdrawal Method</Label>
            <div className="grid grid-cols-1 gap-3">
              <label className="bg-gray-800 rounded-md p-3 cursor-pointer flex items-center">
                <input type="radio" name="withdrawal-method" className="mr-2" defaultChecked />
                <div className="flex items-center">
                  <i className="ri-bank-line mr-2 text-accent"></i>
                  <span className="text-white text-sm">Bank Transfer</span>
                </div>
              </label>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              onClick={handleWithdraw}
              className="w-full bg-accent hover:bg-accent/90 text-white py-3 rounded-lg font-medium mb-3"
              disabled={withdrawMutation.isPending}
            >
              {withdrawMutation.isPending ? (
                <>
                  <i className="ri-loader-4-line animate-spin mr-2"></i>
                  Processing...
                </>
              ) : (
                "Request Withdrawal"
              )}
            </Button>
          </DialogFooter>
          <p className="text-gray-500 text-xs text-center">Withdrawal requests are processed manually within 24-48 hours</p>
        </DialogContent>
      </Dialog>
    </>
  );
}
