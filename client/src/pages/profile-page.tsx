import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import WalletCard from "@/components/profile/WalletCard";
import TransactionHistory from "@/components/profile/TransactionHistory";
import AccountSettings from "@/components/profile/settings/AccountSettings";
import SupportChat from "@/components/profile/support/SupportChat";
import PrivacyPolicy from "@/components/profile/privacy/PrivacyPolicy";
import { Settings, HelpCircle, Shield, LogOut, Loader2 } from "lucide-react";
import { Bet } from "@shared/schema";

type ScreenView = 'main' | 'settings' | 'support' | 'privacy';

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [currentView, setCurrentView] = useState<ScreenView>('main');
  
  // Fetch user bets
  const { data: userBets, isLoading: isLoadingBets } = useQuery<Bet[]>({
    queryKey: ["/api/bets"],
    enabled: !!user,
  });
  
  // Fetch results for win calculation
  const { data: results } = useQuery<any[]>({
    queryKey: ["/api/results"],
    enabled: !!user && !!userBets,
  });
  
  // Calculate total bets and wins
  const totalBets = userBets?.length || 0;
  
  // Calculate wins by comparing user bets with results
  const wins = userBets?.filter(bet => {
    // Find corresponding result for this bet's date
    const betDate = new Date(bet.date);
    const matchingResult = results && results.length > 0 ? results.find((r: any) => {
      const resultDate = new Date(r.date);
      return resultDate.toDateString() === betDate.toDateString();
    }) : null;
    
    if (!matchingResult) return false;
    
    // Check if the bet matches the result for the correct round
    return (bet.round === 1 && matchingResult.round1 === bet.number) ||
           (bet.round === 2 && matchingResult.round2 === bet.number);
  }).length || 0;
  
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: "Logged out",
          description: "You have been logged out successfully."
        });
        setLocation("/");
      }
    });
  };
  
  if (!user) {
    return <div className="container mx-auto px-4 py-4 text-center">Loading profile...</div>;
  }
  
  // Get user initials for avatar
  const getInitials = () => {
    if (!user.name) return "U";
    return user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };
  
  // Render the correct view based on currentView state
  if (currentView === 'settings') {
    return (
      <div className="container mx-auto px-4 py-4">
        <AccountSettings onBack={() => setCurrentView('main')} />
      </div>
    );
  }
  
  if (currentView === 'support') {
    return (
      <div className="container mx-auto px-4 py-4">
        <SupportChat onBack={() => setCurrentView('main')} />
      </div>
    );
  }
  
  if (currentView === 'privacy') {
    return (
      <div className="container mx-auto px-4 py-4">
        <PrivacyPolicy onBack={() => setCurrentView('main')} />
      </div>
    );
  }
  
  // Main profile view
  return (
    <div className="container mx-auto px-4 py-4">
      {/* User Profile */}
      <div className="bg-secondary rounded-xl p-4 mb-6 shadow-md">
        <div className="flex items-center mb-4">
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center text-white text-xl font-poppins mr-4">
            {getInitials()}
          </div>
          <div>
            <h2 className="text-white font-poppins font-semibold">{user.name || user.username}</h2>
            <p className="text-gray-400 text-sm">{user.email || `@${user.username}`}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-2">
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <p className="text-gray-400 text-xs mb-1">Total Bets</p>
            {isLoadingBets ? (
              <div className="flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              </div>
            ) : (
              <p className="font-mono font-bold text-xl text-white">{totalBets}</p>
            )}
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <p className="text-gray-400 text-xs mb-1">Wins</p>
            {isLoadingBets ? (
              <div className="flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-green-500" />
              </div>
            ) : (
              <p className="font-mono font-bold text-xl text-green-500">{wins}</p>
            )}
          </div>
        </div>
      </div>
      
      {/* E-Wallet Section */}
      <WalletCard />
      
      {/* Recent Transactions */}
      <TransactionHistory />
      
      {/* Settings & Logout */}
      <div className="bg-secondary rounded-xl p-4 mb-6 shadow-md">
        <div className="divide-y divide-gray-700">
          <button 
            className="w-full py-3 flex justify-between items-center text-white"
            onClick={() => setCurrentView('settings')}
          >
            <div className="flex items-center">
              <Settings className="h-5 w-5 mr-3 text-accent" />
              <span>Account Settings</span>
            </div>
            <span className="text-gray-500">&rarr;</span>
          </button>
          
          <button 
            className="w-full py-3 flex justify-between items-center text-white"
            onClick={() => setCurrentView('support')}
          >
            <div className="flex items-center">
              <HelpCircle className="h-5 w-5 mr-3 text-accent" />
              <span>Help & Support</span>
            </div>
            <span className="text-gray-500">&rarr;</span>
          </button>
          
          <button 
            className="w-full py-3 flex justify-between items-center text-white"
            onClick={() => setCurrentView('privacy')}
          >
            <div className="flex items-center">
              <Shield className="h-5 w-5 mr-3 text-accent" />
              <span>Privacy Policy</span>
            </div>
            <span className="text-gray-500">&rarr;</span>
          </button>
          
          <Button
            variant="ghost"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className="w-full py-3 flex items-center justify-start text-red-500 hover:text-red-400"
          >
            {logoutMutation.isPending ? (
              <Loader2 className="h-5 w-5 mr-3 animate-spin" />
            ) : (
              <LogOut className="h-5 w-5 mr-3" />
            )}
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
