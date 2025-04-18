import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@shared/schema";

// Extend Transaction type to include possible metadata
interface ExtendedTransaction extends Omit<Transaction, 'metadata'> {
  metadata: Record<string, any> | null;
}
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export default function TransactionHistory() {
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<ExtendedTransaction | null>(null);
  const itemsPerPage = 10;
  
  const { data: transactions, isLoading, refetch } = useQuery<ExtendedTransaction[]>({
    queryKey: ["/api/transactions"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  // Query for bets to cross-reference with transactions
  const { data: bets } = useQuery({
    queryKey: ["/api/bets"],
  });
  
  // Store processed transactions
  const [processedTransactions, setProcessedTransactions] = useState<ExtendedTransaction[]>([]);

  // Process transaction data to add metadata for numbers and rounds
  useEffect(() => {
    if (!transactions) return;
    
    // For each transaction, extract metadata from description
    const updatedTransactions = transactions.map(transaction => {
      let updatedTransaction = {...transaction};
      
      // Handle bet and win transactions
      if ((transaction.type === "bet" || transaction.type === "win") && transaction.description) {
        // Try to extract from description first
        const numberMatch = transaction.description.match(/number (\d+)/);
        const roundMatch = transaction.description.match(/Round (\d+)/);
        
        if (numberMatch && roundMatch) {
          const metadata = {
            ...transaction.metadata,
            number: parseInt(numberMatch[1]),
            round: parseInt(roundMatch[1])
          };
          updatedTransaction = { ...transaction, metadata };
        }
      }
      
      // Handle deposit transactions with payment status
      if (transaction.type === "deposit" && transaction.razorpayPaymentId) {
        // If there's a payment ID but status is null/undefined, mark as completed
        if (!transaction.status) {
          updatedTransaction = { 
            ...transaction, 
            status: "completed"
          };
        }
      }
      
      return updatedTransaction;
    });
    
    setProcessedTransactions(updatedTransactions);
  }, [transactions]);
  
  // Set up auto-refresh for transaction data
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 15000); // Refresh every 15 seconds
    
    return () => clearInterval(interval);
  }, [refetch]);
  
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <i className="ri-arrow-right-down-line text-green-500"></i>;
      case "withdraw":
        return <i className="ri-arrow-right-up-line text-accent"></i>;
      case "bet":
        return <i className="ri-gamepad-line text-accent"></i>;
      case "win":
        return <i className="ri-trophy-line text-green-500"></i>;
      default:
        return <i className="ri-exchange-line text-gray-400"></i>;
    }
  };
  
  const getTransactionTitle = (type: string) => {
    switch (type) {
      case "deposit":
        return "Deposit";
      case "withdraw":
        return "Withdrawal";
      case "bet":
        return "Bet Placed";
      case "win":
        return "Bet Win";
      default:
        return "Transaction";
    }
  };
  
  // Calculate total pages
  const totalPages = processedTransactions ? Math.ceil(processedTransactions.length / itemsPerPage) : 0;
  
  // Get current page of transactions
  const getCurrentPageItems = () => {
    if (!processedTransactions || processedTransactions.length === 0) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return processedTransactions.slice(startIndex, endIndex);
  };
  
  // Handle pagination
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  // Transaction list display
  const renderTransactionList = (items: ExtendedTransaction[]) => {
    return items.map(transaction => (
      <div 
        key={transaction.id} 
        className="border-b border-gray-700 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-800/50 px-2 rounded-md transition-colors"
        onClick={() => setSelectedTransaction(transaction)}
      >
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mr-3">
            {getTransactionIcon(transaction.type)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-white text-sm">{getTransactionTitle(transaction.type)}</p>
              
              {/* Status indicator */}
              {transaction.status === "failed" && (
                <span className="bg-red-500/20 text-red-500 text-xs px-1.5 py-0.5 rounded">Failed</span>
              )}
              {transaction.status === "pending" && (
                <span className="bg-yellow-500/20 text-yellow-500 text-xs px-1.5 py-0.5 rounded">Pending</span>
              )}
            </div>
            
            <p className="text-white text-xs">
              {format(new Date(transaction.date), "MMM d, yyyy · h:mm a")}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`font-mono font-medium ${transaction.amount > 0 ? 'text-green-500' : transaction.type === 'withdraw' ? 'text-white' : 'text-accent'}`}>
            {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
          </p>
          
          {/* Show round and number for bet and win transactions */}
          {(transaction.type === "bet" || transaction.type === "win") && transaction.metadata?.number && (
            <p className="text-xs text-gray-400">
              #{transaction.metadata.number} · 
              {transaction.metadata.round === 1 ? "1st" : "2nd"} Round
            </p>
          )}
        </div>
      </div>
    ));
  };
  
  return (
    <>
      <div className="bg-secondary rounded-xl p-4 mb-6 shadow-md">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-white font-poppins font-semibold">
            {showAllTransactions ? "All Transactions" : "Recent Transactions"}
          </h2>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-xs text-accent hover:text-accent/80"
            onClick={() => {
              setShowAllTransactions(!showAllTransactions);
              setCurrentPage(1);
            }}
          >
            {showAllTransactions ? "Show Recent" : "View All"}
          </Button>
        </div>
        
        <div className="overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : processedTransactions && processedTransactions.length > 0 ? (
            showAllTransactions ? (
              <div className="space-y-1">
                {renderTransactionList(getCurrentPageItems())}
              </div>
            ) : (
              <div className="space-y-1">
                {renderTransactionList(processedTransactions.slice(0, 5))}
              </div>
            )
          ) : (
            <div className="text-white text-center py-8">No transactions found</div>
          )}
        </div>
        
        {/* Pagination controls - only show when viewing all transactions */}
        {showAllTransactions && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className="text-white"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Prev
            </Button>
            
            <span className="text-sm text-white">
              Page {currentPage} of {totalPages}
            </span>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="text-white"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
      
      {/* Transaction detail modal */}
      <Dialog open={!!selectedTransaction} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
        <DialogContent className="bg-secondary text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-poppins font-semibold text-lg">Transaction Details</DialogTitle>
            <DialogDescription className="text-white">
              Transaction ID: {selectedTransaction?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="flex justify-center mb-2">
                <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
                  {getTransactionIcon(selectedTransaction.type)}
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-white text-lg font-medium">{getTransactionTitle(selectedTransaction.type)}</h3>
                <p className={`font-mono font-bold text-2xl mt-1 ${selectedTransaction.amount > 0 ? 'text-green-500' : selectedTransaction.type === 'withdraw' ? 'text-white' : 'text-accent'}`}>
                  {selectedTransaction.amount > 0 ? '+' : ''}{formatCurrency(selectedTransaction.amount)}
                </p>
                <p className="text-white text-sm mt-1">
                  {format(new Date(selectedTransaction.date), "MMMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-white">Type:</span>
                  <span className="text-white font-medium">{selectedTransaction.type}</span>
                </div>
                
                {(selectedTransaction.type === "bet" || selectedTransaction.type === "win") && (
                  <div className="flex justify-between">
                    <span className="text-white">Number:</span>
                    <span className="text-white font-medium">{selectedTransaction.metadata?.number || "N/A"}</span>
                  </div>
                )}
                
                {(selectedTransaction.type === "bet" || selectedTransaction.type === "win") && (
                  <div className="flex justify-between">
                    <span className="text-white">Round:</span>
                    <span className="text-white font-medium">{selectedTransaction.metadata?.round === 1 ? "1st Round (15:30)" : selectedTransaction.metadata?.round === 2 ? "2nd Round (16:30)" : "N/A"}</span>
                  </div>
                )}
                
                {selectedTransaction.type === "withdraw" && selectedTransaction.metadata?.method && (
                  <div className="flex justify-between">
                    <span className="text-white">Method:</span>
                    <span className="text-white font-medium capitalize">{selectedTransaction.metadata.method}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-white">Status:</span>
                  {selectedTransaction.status === "failed" ? (
                    <span className="text-red-500 font-medium">Failed</span>
                  ) : selectedTransaction.status === "pending" ? (
                    <span className="text-yellow-500 font-medium">Pending</span>
                  ) : (
                    <span className="text-green-500 font-medium">Completed</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
