import { useState } from "react";
import { cn, formatCurrency, formatTwoDigits } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ShoppingCart, X, Trash2, CreditCard } from "lucide-react";

interface BetItem {
  number: number;
  amount: number;
  round: number;
}

interface BettingCartProps {
  cartItems: BetItem[];
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  selectedRound: number;
}

export default function BettingCart({ 
  cartItems,
  onRemoveItem,
  onClearCart,
  onCheckout,
  selectedRound
}: BettingCartProps) {
  const [expanded, setExpanded] = useState(true);
  
  // Calculate totals
  const totalAmount = cartItems.reduce((sum, item) => sum + item.amount, 0);
  const totalItems = cartItems.length;
  const potentialWinnings = totalAmount * 80; // 80x multiplier
  
  // Group items by round for better display
  const round1Items = cartItems.filter(item => item.round === 1);
  const round2Items = cartItems.filter(item => item.round === 2);
  
  return (
    <div className="bg-secondary rounded-xl p-4 shadow-md">
      <div 
        className="flex justify-between items-center cursor-pointer mb-2"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center">
          <ShoppingCart className="text-accent mr-2 h-5 w-5" />
          <h2 className="text-white font-poppins font-semibold">Betting Cart</h2>
          <span className="ml-2 bg-accent/20 text-accent text-xs px-2 py-1 rounded-full">
            {totalItems} {totalItems === 1 ? 'number' : 'numbers'}
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          className="h-8 w-8 p-0 rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {expanded ? (
            <X className="h-4 w-4 text-gray-400" />
          ) : (
            <span className="text-accent text-xs font-medium">View</span>
          )}
        </Button>
      </div>
      
      {expanded && (
        <>
          <div className="divide-y divide-gray-700">
            {round1Items.length > 0 && (
              <div className="py-2">
                <p className="text-white text-xs mb-2">Round 1 (15:30 IST)</p>
                <div className="grid grid-cols-4 gap-2">
                  {round1Items.map((item, index) => (
                    <div 
                      key={`round1-${index}`}
                      className="bg-gray-800 rounded-md p-2 relative"
                    >
                      <button
                        className="absolute -top-1 -right-1 bg-red-500/80 text-white rounded-full h-4 w-4 flex items-center justify-center"
                        onClick={() => onRemoveItem(cartItems.findIndex(i => 
                          i.number === item.number && i.round === item.round && i.amount === item.amount
                        ))}
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <p className="text-white text-center font-mono font-medium text-lg">
                        {formatTwoDigits(item.number)}
                      </p>
                      <p className="text-white text-xs text-center mt-1">
                        {formatCurrency(item.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {round2Items.length > 0 && (
              <div className="py-2">
                <p className="text-white text-xs mb-2">Round 2 (16:30 IST)</p>
                <div className="grid grid-cols-4 gap-2">
                  {round2Items.map((item, index) => (
                    <div 
                      key={`round2-${index}`}
                      className="bg-gray-800 rounded-md p-2 relative"
                    >
                      <button
                        className="absolute -top-1 -right-1 bg-red-500/80 text-white rounded-full h-4 w-4 flex items-center justify-center"
                        onClick={() => onRemoveItem(cartItems.findIndex(i => 
                          i.number === item.number && i.round === item.round && i.amount === item.amount
                        ))}
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <p className="text-white text-center font-mono font-medium text-lg">
                        {formatTwoDigits(item.number)}
                      </p>
                      <p className="text-white text-xs text-center mt-1">
                        {formatCurrency(item.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="flex justify-between mb-1">
              <p className="text-white text-sm">Total Amount:</p>
              <p className="text-white font-mono font-medium">
                {formatCurrency(totalAmount)}
              </p>
            </div>
            <div className="flex justify-between mb-3">
              <p className="text-white text-sm">Potential Winning:</p>
              <p className="text-green-400 font-mono font-medium">
                {formatCurrency(potentialWinnings)}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-red-400 border-red-400 hover:bg-red-900/20"
                onClick={onClearCart}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
              
              <Button
                size="sm"
                className="bg-accent hover:bg-accent/90 text-white"
                onClick={onCheckout}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Checkout
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}