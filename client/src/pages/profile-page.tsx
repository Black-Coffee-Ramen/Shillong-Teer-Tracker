import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQuery, QueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import WalletCard from "@/components/profile/WalletCard";
import TransactionHistory from "@/components/profile/TransactionHistory";
import AccountSettings from "@/components/profile/settings/AccountSettings";
import SupportChat from "@/components/profile/support/SupportChat";
import PrivacyPolicy from "@/components/profile/privacy/PrivacyPolicy";
import ResultsManager from "@/components/profile/admin/ResultsManager";
import UserManagement from "@/components/profile/admin/UserManagement";
import { BetExport } from "@/components/profile/admin/BetExport";
import { Settings, HelpCircle, Shield, LogOut, Loader2, RefreshCw, Database, Users, FileDown } from "lucide-react";
import { Bet } from "@shared/schema";

type ScreenView = 'main' | 'settings' | 'support' | 'privacy' | 'admin';

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [currentView, setCurrentView] = useState<ScreenView>('main');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Fetch user bets with auto-refresh
  const { 
    data: userBets, 
    isLoading: isLoadingBets,
    refetch: refetchBets
  } = useQuery<Bet[]>({
    queryKey: ["/api/bets"],
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  // Fetch results for win calculation with auto-refresh
  const { 
    data: results,
    refetch: refetchResults
  } = useQuery<any[]>({
    queryKey: ["/api/results"],
    enabled: !!user && !!userBets,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  // Manual refresh function
  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchBets(),
        refetchResults()
      ]);
      toast({
        title: "Data Refreshed",
        description: "Your profile data has been updated.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Could not refresh data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
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
  
  // Admin view
  if (currentView === 'admin') {
    return (
      <div className="container mx-auto px-4 py-4">
        <div className="mb-4">
          <Button 
            variant="outline" 
            onClick={() => setCurrentView('main')}
            className="text-gray-800 border-gray-300 hover:bg-gray-50"
          >
            &larr; Back to Profile
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900 mt-4 mb-6">Admin Dashboard</h1>
        </div>
        
        {/* User Management */}
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <Users className="h-5 w-5 mr-2 text-purple-700" />
            <h2 className="text-xl font-medium text-gray-800">User Management</h2>
          </div>
          <UserManagement />
        </div>
        
        {/* Results Management */}
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <Database className="h-5 w-5 mr-2 text-purple-700" />
            <h2 className="text-xl font-medium text-gray-800">Results Management</h2>
          </div>
          <ResultsManager />
        </div>
        
        {/* Bet Export */}
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <FileDown className="h-5 w-5 mr-2 text-purple-700" />
            <h2 className="text-xl font-medium text-gray-800">Data Export</h2>
          </div>
          <BetExport />
        </div>
      </div>
    );
  }

  // Main profile view
  return (
    <div className="container mx-auto px-4 py-4">
      {/* User Profile */}
      <div className="card-modern p-4 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-xl font-medium mr-4">
              {getInitials()}
            </div>
            <div>
              <h2 className="text-gray-900 font-semibold">{user.name || user.username}</h2>
              <p className="text-gray-600 text-sm">{user.email || `@${user.username}`}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-primary hover:bg-primary/5 border-primary/20"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-2">
          <div className="bg-white border border-gray-200 rounded-lg p-3 text-center shadow-sm">
            <p className="text-gray-600 text-xs mb-1">Total Bets</p>
            {isLoadingBets ? (
              <div className="flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (
              <p className="font-mono font-bold text-xl text-gray-900">{totalBets}</p>
            )}
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3 text-center shadow-sm">
            <p className="text-gray-600 text-xs mb-1">Wins</p>
            {isLoadingBets ? (
              <div className="flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-green-600" />
              </div>
            ) : (
              <p className="font-mono font-bold text-xl text-green-600">{wins}</p>
            )}
          </div>
        </div>
      </div>
      
      {/* E-Wallet Section */}
      <WalletCard />
      
      {/* Recent Transactions */}
      <TransactionHistory />
      
      {/* Settings & Logout */}
      <div className="card-modern p-4 mb-6 shadow-sm">
        <div className="divide-y divide-gray-200">
          <button 
            className="w-full py-3 flex justify-between items-center text-gray-800 hover:bg-gray-50 rounded-md"
            onClick={() => setCurrentView('settings')}
          >
            <div className="flex items-center">
              <Settings className="h-5 w-5 mr-3 text-primary" />
              <span>Account Settings</span>
            </div>
            <span className="text-gray-400">&rarr;</span>
          </button>
          
          <button 
            className="w-full py-3 flex justify-between items-center text-gray-800 hover:bg-gray-50 rounded-md"
            onClick={() => setCurrentView('support')}
          >
            <div className="flex items-center">
              <HelpCircle className="h-5 w-5 mr-3 text-primary" />
              <span>Help & Support</span>
            </div>
            <span className="text-gray-400">&rarr;</span>
          </button>
          
          <button 
            className="w-full py-3 flex justify-between items-center text-gray-800 hover:bg-gray-50 rounded-md"
            onClick={() => setCurrentView('privacy')}
          >
            <div className="flex items-center">
              <Shield className="h-5 w-5 mr-3 text-primary" />
              <span>Privacy Policy</span>
            </div>
            <span className="text-gray-400">&rarr;</span>
          </button>
          
          {/* Admin button - only show for admin users */}
          {user.username === 'admin' && (
            <button 
              className="w-full py-3 flex justify-between items-center text-gray-800 hover:bg-gray-50 rounded-md"
              onClick={() => setCurrentView('admin')}
            >
              <div className="flex items-center">
                <Database className="h-5 w-5 mr-3 text-primary" />
                <span>Admin Dashboard</span>
              </div>
              <span className="text-gray-400">&rarr;</span>
            </button>
          )}
          
          <Button
            variant="ghost"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className="w-full py-3 flex items-center justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
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
