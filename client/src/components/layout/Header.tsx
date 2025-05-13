import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/utils";
import { Logo } from "@/components/common/Logo";
import { Wallet } from "lucide-react";
import { Link } from "wouter";

export default function Header() {
  const { user } = useAuth();
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <div className="flex items-center">
            <div className="bg-primary w-8 h-8 rounded-full flex items-center justify-center mr-2">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="font-medium text-gray-900">Shillong Teer</span>
          </div>
        </Link>
        
        <div className="flex items-center gap-4">
          {/* Main Navigation */}
          <nav className="hidden md:flex">
            <Link href="/play" className="nav-item">Play</Link>
            <Link href="/results" className="nav-item">Results</Link>
            <Link href="/profile" className="nav-item">Profile</Link>
          </nav>
          
          {/* Wallet Balance */}
          {user ? (
            <div className="btn-outline rounded-md py-1.5 px-4 flex items-center gap-2">
              <Wallet className="text-primary w-4 h-4" />
              <span className="font-medium text-gray-800 text-sm">{formatCurrency(user.balance)}</span>
            </div>
          ) : (
            <Link href="/auth" className="text-sm font-medium text-primary">
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
