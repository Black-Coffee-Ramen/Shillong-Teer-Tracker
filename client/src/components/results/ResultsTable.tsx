import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Bet, Result } from "@shared/schema";
import { formatTwoDigits, formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useNotification } from "@/hooks/use-notification";
import { CalendarX, BarChart2 } from "lucide-react";
import DetailedAnalysis from "./analysis/DetailedAnalysis";

export default function ResultsTable() {
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [showAnalysis, setShowAnalysis] = useState<boolean>(false);
  const [notificationsShown, setNotificationsShown] = useState<string[]>([]);
  const [resultsLimit, setResultsLimit] = useState<number>(10); // Number of results to display
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
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, resultsLimit);
  
  // Calculate frequent numbers from results data
  const frequentNumbers: Array<[number, number]> = useMemo(() => {
    if (!results || results.length === 0) return [];
    
    // Get last 30 days results
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentResults = results.filter(result => {
      const resultDate = new Date(result.date);
      return resultDate >= thirtyDaysAgo;
    });
    
    // Collect all numbers from both rounds
    const allNumbers: number[] = [];
    recentResults.forEach(result => {
      if (result.round1 !== null && result.round1 !== undefined) {
        allNumbers.push(result.round1);
      }
      if (result.round2 !== null && result.round2 !== undefined) {
        allNumbers.push(result.round2);
      }
    });
    
    // Count occurrences
    const numberCounts: Record<string, number> = {};
    allNumbers.forEach(num => {
      const numStr = num.toString();
      numberCounts[numStr] = (numberCounts[numStr] || 0) + 1;
    });
    
    // Convert to array and sort by count
    const sortedFrequent = Object.entries(numberCounts)
      .map(([num, count]): [number, number] => [parseInt(num), count])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Get top 5
      
    return sortedFrequent;
  }, [results]);
  
  // Check for matching bets when result is shown
  useEffect(() => {
    if (!selectedDateResult || !userBets || !user) return;
    
    // Function to check and show notifications for a specific round
    const checkAndNotifyForRound = (round: number) => {
      const resultNumber = round === 1 ? selectedDateResult.round1 : selectedDateResult.round2;
      if (resultNumber === null || resultNumber === undefined) return;
      
      // Create unique notification key based on result ID, date, and round
      const notificationKey = `${selectedDateResult.id}-${round}`;
      
      // Skip if we've already shown notifications for this result
      if (notificationsShown.includes(notificationKey)) return;
      
      // Get bets for this date and round
      const matchingBets = userBets.filter(bet => {
        const betDate = new Date(bet.date);
        const resultDate = new Date(selectedDateResult.date);
        const isSameDate = format(betDate, 'yyyy-MM-dd') === format(resultDate, 'yyyy-MM-dd');
        
        // Only consider bets placed BEFORE the result time
        const isBeforeResult = round === 1 
          ? betDate.getHours() < 15 || (betDate.getHours() === 15 && betDate.getMinutes() < 30)
          : betDate.getHours() < 16 || (betDate.getHours() === 16 && betDate.getMinutes() < 30);
        
        return isSameDate && bet.round === round && isBeforeResult;
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
      
      // Mark this notification as shown
      return notificationKey;
    };
    
    // Check both rounds
    const newShownNotifications: string[] = [];
    
    const round1Key = checkAndNotifyForRound(1);
    if (round1Key) newShownNotifications.push(round1Key);
    
    const round2Key = checkAndNotifyForRound(2);
    if (round2Key) newShownNotifications.push(round2Key);
    
    // Update shown notifications if we have new ones
    if (newShownNotifications.length > 0) {
      setNotificationsShown(prev => [...prev, ...newShownNotifications]);
    }
  }, [selectedDateResult, userBets, user, addNotification, notificationsShown]);
  
  return (
    <>
      {showAnalysis ? (
        <DetailedAnalysis onBack={() => setShowAnalysis(false)} />
      ) : (
        <>
          <div className="card-modern p-4 mb-6 shadow-sm">
            <h2 className="text-gray-900 font-semibold mb-4">Shillong Teer Results</h2>
            
            {/* Date Selector */}
            <div className="flex items-center mb-4">
              <button 
                className="text-gray-600 p-1" 
                onClick={() => navigateDate(-1)}
              >
                <i className="ri-arrow-left-s-line text-xl"></i>
              </button>
              <input 
                type="date" 
                className="bg-white border border-gray-200 text-gray-800 px-3 py-2 rounded-md flex-1 text-center" 
                value={selectedDate}
                onChange={handleDateChange}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
              <button 
                className="text-gray-600 p-1" 
                onClick={() => navigateDate(1)}
                disabled={format(new Date(), 'yyyy-MM-dd') === selectedDate}
              >
                <i className="ri-arrow-right-s-line text-xl"></i>
              </button>
            </div>
            
            {/* Today's Result Display */}
            <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 ${isSunday ? 'border border-red-300' : ''}`}>
              <div className="flex items-center justify-center mb-3">
                <p className="text-gray-700 text-center text-sm">
                  {selectedDate ? format(new Date(selectedDate), 'MMMM d, yyyy') : ''}
                </p>
                {isSunday && (
                  <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                    Sunday - Closed
                  </span>
                )}
              </div>
              
              {isSunday ? (
                <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
                  <CalendarX className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-red-600 font-medium">Market closed on Sundays</p>
                  <p className="text-gray-600 text-sm mt-1">Shillong Teer does not operate on Sundays</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className={`bg-white rounded-lg p-3 text-center border border-gray-200 ${!selectedDateResult && isFutureOrToday ? 'border border-yellow-400' : ''}`}>
                    <p className="text-gray-600 text-xs mb-1">Round 1 (15:30)</p>
                    <p className="font-mono font-bold text-2xl text-gray-900">
                      {isLoading ? (
                        <span>Loading...</span>
                      ) : selectedDateResult?.round1 !== undefined && selectedDateResult.round1 !== null ? (
                        <span className="text-primary">{formatTwoDigits(selectedDateResult.round1)}</span>
                      ) : isFutureOrToday ? (
                        <span className="text-amber-600">Pending</span>
                      ) : (
                        <span className="text-gray-500">Not Available</span>
                      )}
                    </p>
                  </div>
                  <div className={`bg-white rounded-lg p-3 text-center border border-gray-200 ${!selectedDateResult && isFutureOrToday ? 'border border-yellow-400' : ''}`}>
                    <p className="text-gray-600 text-xs mb-1">Round 2 (16:30)</p>
                    <p className="font-mono font-bold text-2xl text-gray-900">
                      {isLoading ? (
                        <span>Loading...</span>
                      ) : selectedDateResult?.round2 !== undefined && selectedDateResult.round2 !== null ? (
                        <span className="text-primary">{formatTwoDigits(selectedDateResult.round2)}</span>
                      ) : isFutureOrToday ? (
                        <span className="text-amber-600">Pending</span>
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
          <div className="card-modern p-4 mb-6 shadow-sm">
            <h2 className="text-gray-900 font-semibold mb-3">Recent Results</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-2 text-gray-600 font-medium text-sm">Date</th>
                    <th className="pb-2 text-gray-600 font-medium text-sm text-center">Round 1</th>
                    <th className="pb-2 text-gray-600 font-medium text-sm text-center">Round 2</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-gray-500">Loading results...</td>
                    </tr>
                  ) : recentResults && recentResults.length > 0 ? (
                    recentResults.map(result => (
                      <tr key={result.id} className="border-b border-gray-200">
                        <td className="py-3 text-gray-800 text-sm">
                          {format(new Date(result.date), 'MMMM d, yyyy')}
                        </td>
                        <td className="py-3 text-center">
                          {result.round1 !== undefined && result.round1 !== null ? (
                            <span className="font-mono text-primary font-medium">
                              {formatTwoDigits(result.round1)}
                            </span>
                          ) : (
                            <span className="text-gray-500">--</span>
                          )}
                        </td>
                        <td className="py-3 text-center">
                          {result.round2 !== undefined && result.round2 !== null ? (
                            <span className="font-mono text-primary font-medium">
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
                      <td colSpan={3} className="py-4 text-center text-gray-500">No results available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <button 
              onClick={() => setResultsLimit(prev => prev + 10)}
              className="w-full border border-purple-700 text-purple-700 hover:bg-purple-100 py-2 rounded-lg mt-4 text-sm flex items-center justify-center gap-2"
              disabled={!results || results.length <= resultsLimit}
            >
              {results && results.length > resultsLimit ? (
                <>
                  <span>Load More Results</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </>
              ) : (
                <span>No More Results Available</span>
              )}
            </button>
          </div>
          
          {/* Result Analysis */}
          <div className="card-modern p-4 mb-6 shadow-sm">
            <h2 className="text-gray-900 font-semibold mb-3 flex items-center">
              <BarChart2 className="h-5 w-5 text-primary mr-2" />
              Result Analysis
            </h2>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
              <p className="text-gray-800 text-sm mb-2">Most Frequent Numbers (Last 30 Days)</p>
              <div className="flex flex-wrap gap-2">
                {frequentNumbers.map(([number, count]) => (
                  <div key={number} className="bg-primary/10 border border-primary/20 px-3 py-1 rounded-full text-gray-800 text-xs flex items-center">
                    <span className="font-mono mr-1">{number.toString().padStart(2, '0')}</span>
                    <span className="text-primary text-xs">({count}x)</span>
                  </div>
                ))}
                {frequentNumbers.length === 0 && (
                  <p className="text-gray-500 text-xs">Analyzing available results data...</p>
                )}
              </div>
            </div>
            
            <button 
              onClick={() => setShowAnalysis(true)}
              className="w-full bg-primary/10 hover:bg-primary/15 text-primary py-2 rounded-lg text-sm flex items-center justify-center"
            >
              <BarChart2 className="h-4 w-4 mr-1" />
              <span>View Detailed Analysis</span>
            </button>
          </div>
        </>
      )}
    </>
  );
}
