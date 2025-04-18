import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { useNotification } from "@/hooks/use-notification";
import { Transaction } from "@shared/schema";

// Define Razorpay interface
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function WalletCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addNotification } = useNotification();
  const [depositAmount, setDepositAmount] = useState<number>(500);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(500);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi">("card");
  const [withdrawalMethod, setWithdrawalMethod] = useState<"bank" | "upi">("bank");
  const [bankDetails, setBankDetails] = useState({
    accountNumber: "",
    ifscCode: "",
    accountName: ""
  });
  const [upiId, setUpiId] = useState("");
  const [isRazorpayReady, setIsRazorpayReady] = useState(false);
  const [useTestMode, setUseTestMode] = useState(false); // Toggle for test vs. real payment
  
  // Load Razorpay script
  useEffect(() => {
    if (!document.getElementById("razorpay-js")) {
      const script = document.createElement("script");
      script.id = "razorpay-js";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => setIsRazorpayReady(true);
      document.body.appendChild(script);
    } else {
      setIsRazorpayReady(true);
    }
    
    return () => {
      // Cleanup - remove script on component unmount if needed
      const existingScript = document.getElementById("razorpay-js");
      if (existingScript && !document.querySelector('[data-razorpay-active="true"]')) {
        existingScript.remove();
      }
    };
  }, []);
  
  // Create Razorpay order
  const createOrderMutation = useMutation({
    mutationFn: async (amount: number) => {
      // apiRequest already returns the parsed JSON response
      return await apiRequest("POST", "/api/payment/create-order", { 
        amount, 
        currency: "INR" 
      });
    },
    onSuccess: (data) => {
      if (isRazorpayReady) {
        openRazorpayCheckout(data);
      } else {
        toast({
          title: "Payment Gateway Error",
          description: "Payment gateway is not ready. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Payment Initialization Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Verify Razorpay payment
  const verifyPaymentMutation = useMutation({
    mutationFn: async (paymentData: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      transactionId: number;
    }) => {
      // apiRequest already returns the parsed JSON response
      return await apiRequest("POST", "/api/payment/verify", paymentData);
    },
    onSuccess: (data) => {
      toast({
        title: "Payment Successful",
        description: `${formatCurrency(depositAmount)} has been added to your wallet.`,
      });
      addNotification(
        `💰 ${formatCurrency(depositAmount)} has been added to your wallet.`,
        "info",
        true
      );
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setIsDepositModalOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Payment Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Direct deposit (testing only)
  const depositMutation = useMutation({
    mutationFn: async (amount: number) => {
      // apiRequest already returns the parsed JSON response, so we don't need to call .json() again
      return await apiRequest("POST", "/api/transactions/deposit", { amount });
    },
    onSuccess: (data) => {
      toast({
        title: "Deposit Successful (Test Mode)",
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
  
  // Get user's transactions to check for recent wins
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    enabled: !!user
  });
  
  // Check if user has recent wins (within the last 2 hours)
  const hasRecentWins = useMemo(() => {
    if (!transactions) return false;
    
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
    
    return transactions.some(
      (transaction: Transaction) => transaction.type === "win" && 
      new Date(transaction.date).getTime() > twoHoursAgo.getTime()
    );
  }, [transactions]);
  
  // Calculate when withdrawal will be available again
  const withdrawalAvailableTime = useMemo(() => {
    if (!transactions) return null;
    
    const winTransactions = transactions.filter((t: Transaction) => t.type === "win");
    if (winTransactions.length === 0) return null;
    
    // Find most recent win
    const mostRecentWin = winTransactions.reduce((latest: Transaction, current: Transaction) => {
      return new Date(current.date) > new Date(latest.date) ? current : latest;
    }, winTransactions[0]);
    
    // Add 2 hours to the win time
    const availableTime = new Date(mostRecentWin.date);
    availableTime.setHours(availableTime.getHours() + 2);
    
    return availableTime;
  }, [transactions]);

  const withdrawMutation = useMutation({
    mutationFn: async (withdrawalData: {
      amount: number;
      method: "bank" | "upi";
      details: any;
    }) => {
      // apiRequest already returns the parsed JSON response
      return await apiRequest("POST", "/api/transactions/withdraw", withdrawalData);
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal Requested",
        description: `Your withdrawal request for ${formatCurrency(withdrawAmount)} has been submitted.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      
      // Reset form fields
      setWithdrawAmount(500);
      setBankDetails({
        accountNumber: "",
        ifscCode: "",
        accountName: ""
      });
      setUpiId("");
      
      setIsWithdrawModalOpen(false);
      
      // Show notification
      addNotification(
        `🔄 Your withdrawal request for ${formatCurrency(withdrawAmount)} has been submitted.`,
        "info",
        true
      );
    },
    onError: (error: Error) => {
      toast({
        title: "Withdrawal Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Open Razorpay checkout
  const openRazorpayCheckout = (orderData: any) => {
    try {
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Shillong Teer",
        description: orderData.description,
        order_id: orderData.id,
        prefill: {
          name: user?.name || user?.username || "",
          email: user?.email || "",
          method: paymentMethod === "upi" ? "upi" : "card"
        },
        notes: orderData.notes,
        theme: {
          color: "#5D3FD3"
        },
        handler: function(response: any) {
          // Handle the payment success
          verifyPaymentMutation.mutate({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            transactionId: Number(orderData.notes.transactionId)
          });
        },
        modal: {
          ondismiss: function() {
            toast({
              title: "Payment Cancelled",
              description: "You have closed the payment window. Your wallet has not been charged.",
              variant: "destructive"
            });
          }
        }
      };
      
      // Set UPI method if selected
      if (paymentMethod === "upi") {
        options.prefill.method = "upi";
      }
      
      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', function (response: any){
        toast({
          title: "Payment Failed",
          description: response.error.description || "Payment could not be processed",
          variant: "destructive"
        });
      });
      
      razorpayInstance.open();
      
    } catch (error) {
      console.error("Error opening Razorpay:", error);
      toast({
        title: "Payment Error",
        description: "Could not initiate payment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRazorpayDeposit = () => {
    if (depositAmount < 100) {
      toast({
        title: "Invalid Amount",
        description: "Minimum deposit amount is ₹100",
        variant: "destructive"
      });
      return;
    }
    
    // Initiate Razorpay payment flow
    createOrderMutation.mutate(depositAmount);
  };
  
  // Handle deposit button click
  const handleDeposit = () => {
    if (depositAmount < 100) {
      toast({
        title: "Invalid Amount",
        description: "Minimum deposit amount is ₹100",
        variant: "destructive"
      });
      return;
    }
    
    if (!useTestMode && isRazorpayReady) {
      // Use Razorpay gateway
      handleRazorpayDeposit();
    } else {
      // Use direct deposit (test mode)
      depositMutation.mutate(depositAmount);
    }
  };
  
  const handleWithdraw = () => {
    // Check amount
    if (withdrawAmount < 500) {
      toast({
        title: "Invalid Amount",
        description: "Minimum withdrawal amount is ₹500",
        variant: "destructive"
      });
      return;
    }
    
    // Check sufficient balance
    if (user && withdrawAmount > user.balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough funds for this withdrawal",
        variant: "destructive"
      });
      return;
    }
    
    // Validate bank details or UPI ID
    if (withdrawalMethod === "bank") {
      if (!bankDetails.accountName || !bankDetails.accountNumber || !bankDetails.ifscCode) {
        toast({
          title: "Missing Bank Details",
          description: "Please provide all required bank account details",
          variant: "destructive"
        });
        return;
      }
      
      if (bankDetails.ifscCode.length < 11) {
        toast({
          title: "Invalid IFSC Code",
          description: "Please enter a valid 11-character IFSC code",
          variant: "destructive"
        });
        return;
      }
    } else if (withdrawalMethod === "upi") {
      if (!upiId || !upiId.includes('@')) {
        toast({
          title: "Invalid UPI ID",
          description: "Please enter a valid UPI ID (e.g., name@upi)",
          variant: "destructive"
        });
        return;
      }
    }
    
    // Prepare withdrawal data
    const withdrawalData = {
      amount: withdrawAmount,
      method: withdrawalMethod,
      details: withdrawalMethod === "bank" ? bankDetails : { upiId }
    };
    
    // Submit withdrawal request
    withdrawMutation.mutate(withdrawalData as any);
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
            onClick={() => {
              if (hasRecentWins) {
                const timeUntil = withdrawalAvailableTime ? 
                  new Date(withdrawalAvailableTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
                  '2 hours';
                
                toast({
                  title: "Withdrawal Restricted",
                  description: `Withdrawals are restricted for 2 hours after winning. Available after ${timeUntil}.`,
                  variant: "destructive"
                });
              } else {
                setIsWithdrawModalOpen(true);
              }
            }}
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
                <input 
                  type="radio" 
                  name="payment-method" 
                  className="mr-2" 
                  checked={paymentMethod === "card"}
                  onChange={() => setPaymentMethod("card")}
                />
                <div className="flex items-center">
                  <i className="ri-bank-card-line mr-2 text-accent"></i>
                  <span className="text-white text-sm">Card</span>
                </div>
              </label>
              <label className="bg-gray-800 rounded-md p-3 cursor-pointer flex items-center">
                <input 
                  type="radio" 
                  name="payment-method" 
                  className="mr-2"
                  checked={paymentMethod === "upi"}
                  onChange={() => setPaymentMethod("upi")}
                />
                <div className="flex items-center">
                  <i className="ri-bank-line mr-2 text-accent"></i>
                  <span className="text-white text-sm">UPI</span>
                </div>
              </label>
            </div>
          </div>
          
          <div className="mb-4 mt-2">
            <div className="flex justify-center mb-2">
              <div className="bg-gray-800 rounded-md p-2 inline-block">
                <img 
                  src="https://i.postimg.cc/kGPKcVYZ/razorpay-logo.png" 
                  alt="Razorpay" 
                  className="h-6" 
                />
              </div>
            </div>
            
            {import.meta.env.DEV && (
              <div className="flex items-center justify-between mt-3 px-1 text-xs text-gray-400">
                <span>Use test mode (without Razorpay)</span>
                <div 
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${useTestMode ? 'bg-green-600' : 'bg-gray-700'}`}
                  onClick={() => setUseTestMode(!useTestMode)}
                  role="switch"
                  aria-checked={useTestMode}
                  tabIndex={0}
                >
                  <span 
                    className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${useTestMode ? 'translate-x-6' : 'translate-x-1'}`} 
                  />
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              onClick={handleDeposit}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium mb-3"
              disabled={depositMutation.isPending || createOrderMutation.isPending || verifyPaymentMutation.isPending}
            >
              {depositMutation.isPending || createOrderMutation.isPending || verifyPaymentMutation.isPending ? (
                <>
                  <i className="ri-loader-4-line animate-spin mr-2"></i>
                  {createOrderMutation.isPending ? "Initializing payment..." : 
                   verifyPaymentMutation.isPending ? "Verifying payment..." : "Processing..."}
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
            
            {/* Information about withdrawal restriction */}
            <div className="mt-2 bg-gray-800/50 border border-yellow-600/30 rounded-md p-2">
              <p className="text-xs text-gray-300">
                <span className="text-yellow-500">ℹ️</span> Withdrawals are restricted for 2 hours after any win to prevent fraud and ensure compliance with regulations.
              </p>
            </div>
          </div>
          
          <div className="mb-4">
            <Label className="block text-gray-300 text-sm mb-2">Withdrawal Method</Label>
            <div className="grid grid-cols-2 gap-3">
              <label className="bg-gray-800 rounded-md p-3 cursor-pointer flex items-center">
                <input 
                  type="radio" 
                  name="withdrawal-method" 
                  className="mr-2" 
                  checked={withdrawalMethod === "bank"}
                  onChange={() => setWithdrawalMethod("bank")}
                />
                <div className="flex items-center">
                  <i className="ri-bank-line mr-2 text-accent"></i>
                  <span className="text-white text-sm">Bank Transfer</span>
                </div>
              </label>
              <label className="bg-gray-800 rounded-md p-3 cursor-pointer flex items-center">
                <input 
                  type="radio" 
                  name="withdrawal-method" 
                  className="mr-2"
                  checked={withdrawalMethod === "upi"}
                  onChange={() => setWithdrawalMethod("upi")}
                />
                <div className="flex items-center">
                  <i className="ri-secure-payment-line mr-2 text-accent"></i>
                  <span className="text-white text-sm">UPI</span>
                </div>
              </label>
            </div>
          </div>
          
          {withdrawalMethod === "bank" ? (
            <div className="mb-4 space-y-3">
              <div>
                <Label className="block text-gray-300 text-sm mb-2">Account Holder Name</Label>
                <Input
                  className="w-full bg-gray-800 text-white px-3 py-3 rounded-md"
                  placeholder="Enter name as per bank account"
                  value={bankDetails.accountName}
                  onChange={(e) => setBankDetails({...bankDetails, accountName: e.target.value})}
                />
              </div>
              <div>
                <Label className="block text-gray-300 text-sm mb-2">Account Number</Label>
                <Input
                  className="w-full bg-gray-800 text-white px-3 py-3 rounded-md font-mono"
                  placeholder="Enter account number"
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                />
              </div>
              <div>
                <Label className="block text-gray-300 text-sm mb-2">IFSC Code</Label>
                <Input
                  className="w-full bg-gray-800 text-white px-3 py-3 rounded-md font-mono uppercase"
                  placeholder="Enter IFSC code"
                  value={bankDetails.ifscCode}
                  onChange={(e) => setBankDetails({...bankDetails, ifscCode: e.target.value.toUpperCase()})}
                />
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <Label className="block text-gray-300 text-sm mb-2">UPI ID</Label>
              <Input
                className="w-full bg-gray-800 text-white px-3 py-3 rounded-md font-mono"
                placeholder="Enter UPI ID (e.g., name@upi)"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
              />
            </div>
          )}
          
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
