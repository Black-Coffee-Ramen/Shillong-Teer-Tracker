import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import WalletCard from "@/components/profile/WalletCard";
import TransactionHistory from "@/components/profile/TransactionHistory";

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  
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
            <p className="font-mono font-bold text-xl text-white">--</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <p className="text-gray-400 text-xs mb-1">Wins</p>
            <p className="font-mono font-bold text-xl text-green-500">--</p>
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
          <button className="w-full py-3 flex justify-between items-center text-white">
            <div className="flex items-center">
              <i className="ri-settings-3-line mr-3 text-gray-500"></i>
              <span>Account Settings</span>
            </div>
            <i className="ri-arrow-right-s-line text-gray-500"></i>
          </button>
          
          <button className="w-full py-3 flex justify-between items-center text-white">
            <div className="flex items-center">
              <i className="ri-question-line mr-3 text-gray-500"></i>
              <span>Help & Support</span>
            </div>
            <i className="ri-arrow-right-s-line text-gray-500"></i>
          </button>
          
          <button className="w-full py-3 flex justify-between items-center text-white">
            <div className="flex items-center">
              <i className="ri-shield-check-line mr-3 text-gray-500"></i>
              <span>Privacy Policy</span>
            </div>
            <i className="ri-arrow-right-s-line text-gray-500"></i>
          </button>
          
          <Button
            variant="ghost"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className="w-full py-3 flex items-center justify-start text-red-500 hover:text-red-400"
          >
            {logoutMutation.isPending ? (
              <i className="ri-loader-4-line animate-spin mr-3"></i>
            ) : (
              <i className="ri-logout-box-line mr-3"></i>
            )}
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
