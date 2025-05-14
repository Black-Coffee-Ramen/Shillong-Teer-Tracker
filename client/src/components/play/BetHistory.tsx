import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Bet } from "@shared/schema";
import { Loader2, Clock, AlertCircle, WifiOff } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useOfflineBets } from "@/hooks/use-offline-data";

export function BetHistory() {
  const { user } = useAuth();
  
  // Fetch betting history from server
  const { 
    data: onlineBets, 
    isLoading: isLoadingOnline, 
    error: onlineError 
  } = useQuery<Bet[]>({
    queryKey: ["/api/betting/history"],
    enabled: !!user,
    refetchInterval: 60000, // Refresh every minute
  });
  
  // Get offline bets from local storage
  const {
    bets: offlineBets,
    isLoading: isLoadingOffline,
    isOffline
  } = useOfflineBets(user?.id);
  
  // Combine online and offline data
  const bets = !isOffline ? onlineBets : offlineBets;
  const isLoading = !isOffline ? isLoadingOnline : isLoadingOffline;
  const error = !isOffline ? onlineError : undefined;
  
  // Format date for display
  const formatBetDate = (date: Date | string) => {
    const dateObj = new Date(date);
    return `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()} ${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
  };
  
  if (!user) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Please log in to view your betting history</p>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Loading betting history...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 flex items-center text-destructive">
        <AlertCircle className="h-5 w-5 mr-2" />
        <p>Failed to load betting history. Please try again later.</p>
      </div>
    );
  }
  
  if (!bets?.length) {
    return (
      <div className="text-center py-8 border rounded-md">
        <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">You haven't placed any bets yet</p>
      </div>
    );
  }
  
  // Show offline indicator if we're using offline data
  const offlineIndicator = isOffline && (
    <div className="flex items-center justify-center mb-4 text-amber-600 text-sm bg-amber-50 py-2 px-3 rounded-md">
      <WifiOff className="h-4 w-4 mr-2" />
      <span>Showing offline bets. Some information may not be up to date.</span>
    </div>
  );
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Your Recent Bets</h3>
      
      {offlineIndicator}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Number</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Round</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {bets && bets.map((bet: Bet) => (
              <tr key={bet.id} className="hover:bg-muted/50">
                <td className="px-4 py-3 text-sm">{formatBetDate(bet.date)}</td>
                <td className="px-4 py-3 text-sm font-medium">{bet.number}</td>
                <td className="px-4 py-3 text-sm">Round {bet.round}</td>
                <td className="px-4 py-3 text-sm">{formatCurrency(bet.amount)}</td>
                <td className="px-4 py-3 text-sm">
                  {bet.isWin ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Won {formatCurrency(bet.winAmount || 0)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Pending
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {bets && bets.length > 10 && (
        <div className="flex justify-center mt-4">
          <Button variant="outline" size="sm">
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}