import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@shared/schema";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

export default function TransactionHistory() {
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });
  
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
  
  return (
    <div className="bg-secondary rounded-xl p-4 mb-6 shadow-md">
      <h2 className="text-white font-poppins font-semibold mb-3">Recent Transactions</h2>
      
      <div className="overflow-hidden">
        {isLoading ? (
          <div className="text-gray-400 text-center py-4">Loading transactions...</div>
        ) : transactions && transactions.length > 0 ? (
          transactions.slice(0, 5).map(transaction => (
            <div key={transaction.id} className="border-b border-gray-700 py-3 flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mr-3">
                  {getTransactionIcon(transaction.type)}
                </div>
                <div>
                  <p className="text-white text-sm">{getTransactionTitle(transaction.type)}</p>
                  <p className="text-gray-500 text-xs">
                    {format(new Date(transaction.date), "MMM d, yyyy · h:mm a")}
                  </p>
                </div>
              </div>
              <p className={`font-mono font-medium ${transaction.amount > 0 ? 'text-green-500' : 'text-accent'}`}>
                {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
              </p>
            </div>
          ))
        ) : (
          <div className="text-gray-400 text-center py-4">No transactions found</div>
        )}
      </div>
      
      {transactions && transactions.length > 5 && (
        <button className="w-full border border-gray-700 text-gray-300 py-2 rounded-lg mt-4 text-sm">
          View All Transactions
        </button>
      )}
    </div>
  );
}
