import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/utils";

export default function Header() {
  const { user } = useAuth();
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-white font-poppins font-bold text-xl">Shillong Teer</h1>
        </div>
        
        {/* Wallet Balance */}
        {user && (
          <div className="bg-gradient-to-r from-secondary to-secondary/70 rounded-full py-1 px-4 text-white flex items-center gap-1">
            <i className="ri-wallet-3-line text-accent"></i>
            <span className="font-mono font-medium">{formatCurrency(user.balance)}</span>
          </div>
        )}
      </div>
    </header>
  );
}
