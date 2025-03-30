import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Bet, Result } from "@shared/schema";
import { formatTwoDigits, formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useNotification } from "@/hooks/use-notification";
import { CalendarX } from "lucide-react";

export default function ResultsTable() {
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const { user } = useAuth();
  const { addNotification } = useNotification();
  
  const { data: results, isLoading } = useQuery<Result[]>({
    queryKey: ["/api/results"],
  });
  
  // Fetch user's bets
  const { data: userBets } = useQuery<Bet[]>({
    queryKey: ["/api/bets"],
    // Only fetch if user is logged in
    enabled: !!user,
  });
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };
  
  const navigateDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(format(date, 'yyyy-MM-dd'));
  };
  
  // Check if selected date is a Sunday
  const isSunday = useMemo(() => {
    const date = new Date(selectedDate);
    return date.getDay() === 0; // 0 is Sunday in JavaScript
  }, [selectedDate]);
  
  // Check if selected date is today or in the future
  const isFutureOrToday = useMemo(() => {
    const selectedDateObj = new Date(selectedDate);
    selectedDateObj.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return selectedDateObj >= today;
  }, [selectedDate]);
  
  // Get selected date's result
  const selectedDateResult = results?.find(result => {
    const resultDate = new Date(result.date);
    return format(resultDate, 'yyyy-MM-dd') === selectedDate;
  });
  
  // Get recent results (excluding selected date)
  const recentResults = results?.filter(result => {
    const resultDate = new Date(result.date);
    return format(resultDate, 'yyyy-MM-dd') !== selectedDate;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
  
  // Check for matching bets when result is shown
  useEffect(() => {
    if (!selectedDateResult || !userBets || !user) return;
    
    // Check both rounds
    [1, 2].forEach(round => {
      const resultNumber = round === 1 ? selectedDateResult.round1 : selectedDateResult.round2;
      if (resultNumber === null || resultNumber === undefined) return;
      
      // Get bets for this date and round
      const matchingBets = userBets.filter(bet => {
        const betDate = new Date(bet.date);
        const resultDate = new Date(selectedDateResult.date);
        return format(betDate, 'yyyy-MM-dd') === format(resultDate, 'yyyy-MM-dd') && 
               bet.round === round;
      });
      
      // Check for exact matches
      const winningBets = matchingBets.filter(bet => bet.number === resultNumber);
      
      if (winningBets.length > 0) {
        // Calculate total winnings
        const totalWinnings = winningBets.reduce((sum, bet) => sum + (bet.amount * 80), 0);
        
        if (totalWinnings > 0) {
          addNotification(
            `🏆 You won ${formatCurrency(totalWinnings)} on ${format(new Date(selectedDateResult.date), 'MMM d')} (Round ${round})! Your number ${formatTwoDigits(resultNumber)} was a winner.`,
            "win"
          );
        }
      }
      
      // Check for near misses
      const nearMissBets = matchingBets.filter(bet => {
        if (bet.number === resultNumber) return false; // Skip winners
        
        const betDigits = [Math.floor(bet.number / 10), bet.number % 10];
        const resultDigits = [Math.floor(resultNumber / 10), resultNumber % 10];
        
        // Check if only one digit is different by 1
        const firstDigitDiff = Math.abs(betDigits[0] - resultDigits[0]);
        const secondDigitDiff = Math.abs(betDigits[1] - resultDigits[1]);
        
        return (firstDigitDiff === 1 && secondDigitDiff === 0) || 
               (firstDigitDiff === 0 && secondDigitDiff === 1);
      });
      
      if (nearMissBets.length > 0) {
        addNotification(
          `😮 So close! Your number ${formatTwoDigits(nearMissBets[0].number)} was just 1 digit away from ${formatTwoDigits(resultNumber)} on ${format(new Date(selectedDateResult.date), 'MMM d')} (Round ${round}).`,
          "near-miss"
        );
      }
    });
  }, [selectedDateResult, userBets, user, addNotification]);
  
  return (
    <>
      <div className="bg-secondary rounded-xl p-4 mb-6 shadow-md">
        <h2 className="text-white font-poppins font-semibold mb-4">Shillong Teer Results</h2>
        
        {/* Date Selector */}
        <div className="flex items-center mb-4">
          <button 
            className="text-gray-400 p-1" 
            onClick={() => navigateDate(-1)}
          >
            <i className="ri-arrow-left-s-line text-xl"></i>
          </button>
          <input 
            type="date" 
            className="bg-gray-800 text-white px-3 py-2 rounded-md flex-1 text-center" 
            value={selectedDate}
            onChange={handleDateChange}
            max={format(new Date(), 'yyyy-MM-dd')}
          />
          <button 
            className="text-gray-400 p-1" 
            onClick={() => navigateDate(1)}
            disabled={format(new Date(), 'yyyy-MM-dd') === selectedDate}
          >
            <i className="ri-arrow-right-s-line text-xl"></i>
          </button>
        </div>
        
        {/* Today's Result Display */}
        <div className={`bg-gray-800 rounded-lg p-4 mb-4 ${isSunday ? 'border border-red-800' : ''}`}>
          <div className="flex items-center justify-center mb-3">
            <p className="text-gray-400 text-center text-sm">
              {selectedDate ? format(new Date(selectedDate), 'MMMM d, yyyy') : ''}
            </p>
            {isSunday && (
              <span className="ml-2 bg-red-900/60 text-red-200 text-xs px-2 py-0.5 rounded-full">
                Sunday - Closed
              </span>
            )}
          </div>
          
          {isSunday ? (
            <div className="bg-red-900/20 rounded-lg p-4 text-center">
              <CalendarX className="h-8 w-8 text-red-500/80 mx-auto mb-2" />
              <p className="text-red-400 font-medium">Market closed on Sundays</p>
              <p className="text-gray-400 text-sm mt-1">Shillong Teer does not operate on Sundays</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className={`bg-secondary rounded-lg p-3 text-center ${!selectedDateResult && isFutureOrToday ? 'border border-yellow-800/50' : ''}`}>
                <p className="text-gray-400 text-xs mb-1">Round 1 (15:30)</p>
                <p className="font-mono font-bold text-2xl text-white">
                  {isLoading ? (
                    <span>Loading...</span>
                  ) : selectedDateResult?.round1 !== undefined && selectedDateResult.round1 !== null ? (
                    <span className="text-accent">{formatTwoDigits(selectedDateResult.round1)}</span>
                  ) : isFutureOrToday ? (
                    <span className="text-yellow-500">Pending</span>
                  ) : (
                    <span className="text-gray-500">Not Available</span>
                  )}
                </p>
              </div>
              <div className={`bg-secondary rounded-lg p-3 text-center ${!selectedDateResult && isFutureOrToday ? 'border border-yellow-800/50' : ''}`}>
                <p className="text-gray-400 text-xs mb-1">Round 2 (16:30)</p>
                <p className="font-mono font-bold text-2xl text-white">
                  {isLoading ? (
                    <span>Loading...</span>
                  ) : selectedDateResult?.round2 !== undefined && selectedDateResult.round2 !== null ? (
                    <span className="text-accent">{formatTwoDigits(selectedDateResult.round2)}</span>
                  ) : isFutureOrToday ? (
                    <span className="text-yellow-500">Pending</span>
                  ) : (
                    <span className="text-gray-500">Not Available</span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Past Results Table */}
      <div className="bg-secondary rounded-xl p-4 mb-6 shadow-md">
        <h2 className="text-white font-poppins font-semibold mb-3">Recent Results</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="pb-2 text-gray-400 font-medium text-sm">Date</th>
                <th className="pb-2 text-gray-400 font-medium text-sm text-center">Round 1</th>
                <th className="pb-2 text-gray-400 font-medium text-sm text-center">Round 2</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-gray-400">Loading results...</td>
                </tr>
              ) : recentResults && recentResults.length > 0 ? (
                recentResults.map(result => (
                  <tr key={result.id} className="border-b border-gray-700">
                    <td className="py-3 text-white text-sm">
                      {format(new Date(result.date), 'MMMM d, yyyy')}
                    </td>
                    <td className="py-3 text-center">
                      {result.round1 !== undefined && result.round1 !== null ? (
                        <span className="font-mono text-accent font-medium">
                          {formatTwoDigits(result.round1)}
                        </span>
                      ) : (
                        <span className="text-gray-500">--</span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      {result.round2 !== undefined && result.round2 !== null ? (
                        <span className="font-mono text-accent font-medium">
                          {formatTwoDigits(result.round2)}
                        </span>
                      ) : (
                        <span className="text-gray-500">--</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-gray-400">No results available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <button className="w-full border border-accent text-accent py-2 rounded-lg mt-4 text-sm">
          Load More Results
        </button>
      </div>
      
      {/* Result Analysis */}
      <div className="bg-secondary rounded-xl p-4 mb-6 shadow-md">
        <h2 className="text-white font-poppins font-semibold mb-3 flex items-center">
          <i className="ri-bar-chart-box-line text-accent mr-2"></i>
          Result Analysis
        </h2>
        
        <div className="bg-gray-800 rounded-lg p-3 mb-3">
          <p className="text-white text-sm mb-2">Most Frequent Numbers (Last 30 Days)</p>
          <div className="flex flex-wrap gap-2">
            <div className="bg-gray-700 px-3 py-1 rounded-full text-white text-xs flex items-center">
              <span className="font-mono mr-1">27</span>
              <span className="text-accent text-xs">(6x)</span>
            </div>
            <div className="bg-gray-700 px-3 py-1 rounded-full text-white text-xs flex items-center">
              <span className="font-mono mr-1">43</span>
              <span className="text-accent text-xs">(5x)</span>
            </div>
            <div className="bg-gray-700 px-3 py-1 rounded-full text-white text-xs flex items-center">
              <span className="font-mono mr-1">76</span>
              <span className="text-accent text-xs">(5x)</span>
            </div>
            <div className="bg-gray-700 px-3 py-1 rounded-full text-white text-xs flex items-center">
              <span className="font-mono mr-1">19</span>
              <span className="text-accent text-xs">(4x)</span>
            </div>
            <div className="bg-gray-700 px-3 py-1 rounded-full text-white text-xs flex items-center">
              <span className="font-mono mr-1">82</span>
              <span className="text-accent text-xs">(4x)</span>
            </div>
          </div>
        </div>
        
        <button className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg text-sm">
          View Detailed Analysis
        </button>
      </div>
    </>
  );
}
