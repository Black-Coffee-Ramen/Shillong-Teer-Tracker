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
    
    // For each transaction, process metadata
    const updatedTransactions = transactions.map(transaction => {
      let updatedTransaction = {...transaction};
      
      // Parse JSON metadata if it exists
      if (transaction.metadata && typeof transaction.metadata === 'string') {
        try {
          updatedTransaction.metadata = JSON.parse(transaction.metadata);
        } catch (error) {
          console.error("Error parsing metadata JSON:", error);
          updatedTransaction.metadata = null;
        }
      }
      
      // If metadata is not available, try to extract from description
      if ((!updatedTransaction.metadata || !updatedTransaction.metadata.number) && 
          (transaction.type === "bet" || transaction.type === "win") && 
          transaction.description) {
        const numberMatch = transaction.description.match(/number (\d+)/);
        const roundMatch = transaction.description.match(/Round (\d+)/);
        
        if (numberMatch && roundMatch) {
          updatedTransaction.metadata = {
            ...(updatedTransaction.metadata || {}),
            number: parseInt(numberMatch[1]),
            round: parseInt(roundMatch[1])
          };
        }
      }
      
      // Handle deposit transactions with payment status
      if (transaction.type === "deposit" && transaction.razorpayPaymentId) {
        // If there's a payment ID but status is null/undefined, mark as completed
        if (!transaction.status) {
          updatedTransaction.status = "completed";
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
        className="border-b border-gray-200 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 px-2 rounded-md transition-colors"
        onClick={() => setSelectedTransaction(transaction)}
      >
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
            {getTransactionIcon(transaction.type)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-gray-800 text-sm">{getTransactionTitle(transaction.type)}</p>
              
              {/* Status indicator */}
              {transaction.status === "failed" && (
                <span className="bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded">Failed</span>
              )}
              {transaction.status === "pending" && (
                <span className="bg-yellow-100 text-yellow-600 text-xs px-1.5 py-0.5 rounded">Pending</span>
              )}
            </div>
            
            <p className="text-gray-600 text-xs">
              {format(new Date(transaction.date), "MMM d, yyyy · h:mm a")}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`font-mono font-medium ${transaction.amount > 0 ? 'text-green-600' : transaction.type === 'withdraw' ? 'text-gray-800' : 'text-purple-700'}`}>
            {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
          </p>
          
          {/* Show round and number for bet and win transactions */}
          {(transaction.type === "bet" || transaction.type === "win") && transaction.metadata?.number && (
            <p className="text-xs text-gray-500">
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
      <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-gray-800 font-poppins font-semibold">
            {showAllTransactions ? "All Transactions" : "Recent Transactions"}
          </h2>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-xs text-purple-700 hover:text-purple-800"
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
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
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
            <div className="text-gray-700 text-center py-8">No transactions found</div>
          )}
        </div>
        
        {/* Pagination controls - only show when viewing all transactions */}
        {showAllTransactions && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className="text-gray-700"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Prev
            </Button>
            
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="text-gray-700"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
      
      {/* Transaction detail modal */}
      <Dialog open={!!selectedTransaction} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
        <DialogContent className="bg-white text-gray-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-800 font-poppins font-semibold text-lg">Transaction Details</DialogTitle>
            <DialogDescription className="text-gray-600">
              Transaction ID: {selectedTransaction?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="flex justify-center mb-2">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                  {getTransactionIcon(selectedTransaction.type)}
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-gray-800 text-lg font-medium">{getTransactionTitle(selectedTransaction.type)}</h3>
                <p className={`font-mono font-bold text-2xl mt-1 ${selectedTransaction.amount > 0 ? 'text-green-600' : selectedTransaction.type === 'withdraw' ? 'text-gray-800' : 'text-purple-700'}`}>
                  {selectedTransaction.amount > 0 ? '+' : ''}{formatCurrency(selectedTransaction.amount)}
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  {format(new Date(selectedTransaction.date), "MMMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 border border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-700">Type:</span>
                  <span className="text-gray-800 font-medium capitalize">{selectedTransaction.type}</span>
                </div>
                
                {(selectedTransaction.type === "bet" || selectedTransaction.type === "win") && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">Number:</span>
                    <span className="text-gray-800 font-medium">{selectedTransaction.metadata?.number || "N/A"}</span>
                  </div>
                )}
                
                {(selectedTransaction.type === "bet" || selectedTransaction.type === "win") && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">Round:</span>
                    <span className="text-gray-800 font-medium">{selectedTransaction.metadata?.round === 1 ? "1st Round (15:30)" : selectedTransaction.metadata?.round === 2 ? "2nd Round (16:30)" : "N/A"}</span>
                  </div>
                )}
                
                {selectedTransaction.type === "withdraw" && selectedTransaction.metadata?.method && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">Method:</span>
                    <span className="text-gray-800 font-medium capitalize">{selectedTransaction.metadata.method}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-700">Status:</span>
                  {selectedTransaction.status === "failed" ? (
                    <span className="text-red-600 font-medium">Failed</span>
                  ) : selectedTransaction.status === "pending" ? (
                    <span className="text-yellow-600 font-medium">Pending</span>
                  ) : (
                    <span className="text-green-600 font-medium">Completed</span>
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
