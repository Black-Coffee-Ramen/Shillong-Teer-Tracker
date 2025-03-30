import { useQuery } from "@tanstack/react-query";
import { format, isToday } from "date-fns";
import { Result } from "@shared/schema";
import { Calendar, Clock } from "lucide-react";

export default function ResultsPreview() {
  const { data: results, isLoading, refetch } = useQuery<Result[]>({
    queryKey: ["/api/results"],
    refetchInterval: 60000, // Refetch every minute
  });
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check if today is Sunday (0 is Sunday in JavaScript)
  const isSunday = today.getDay() === 0;
  
  const todayResult = results?.find(r => {
    const resultDate = new Date(r.date);
    resultDate.setHours(0, 0, 0, 0);
    return resultDate.getTime() === today.getTime();
  });
  
  // Get yesterday's result for reference
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const yesterdayResult = results?.find(r => {
    const resultDate = new Date(r.date);
    resultDate.setHours(0, 0, 0, 0);
    return resultDate.getTime() === yesterday.getTime();
  });
  
  return (
    <>
      {isSunday ? (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mt-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Calendar className="h-4 w-4 text-red-500 mr-2" />
            <p className="text-red-400 text-sm font-medium">Sunday - No Results Today</p>
          </div>
          <p className="text-gray-400 text-xs mb-3">Shillong Teer does not operate on Sundays</p>
          
          {/* Show previous day's results for reference */}
          {yesterdayResult && (
            <div>
              <p className="text-white text-xs font-medium mb-2">
                Saturday's Results 
                <span className="text-gray-500 ml-1">
                  ({format(new Date(yesterdayResult.date), 'dd/MM')})
                </span>:
              </p>
              <div className="flex justify-center gap-3">
                <div className="bg-gray-800 rounded-lg px-2 py-1 inline-block">
                  <span className="text-xs text-gray-500 mr-1">R1:</span>
                  <span className="font-mono text-accent text-sm font-medium">
                    {yesterdayResult.round1?.toString().padStart(2, '0') || '--'}
                  </span>
                </div>
                <div className="bg-gray-800 rounded-lg px-2 py-1 inline-block">
                  <span className="text-xs text-gray-500 mr-1">R2:</span>
                  <span className="font-mono text-accent text-sm font-medium">
                    {yesterdayResult.round2?.toString().padStart(2, '0') || '--'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <p className="text-gray-400 text-xs mb-1">Round 1 (15:30)</p>
            <p className="font-mono font-bold text-xl text-white">
              {isLoading ? (
                "Loading..."
              ) : todayResult?.round1 !== undefined && todayResult.round1 !== null ? (
                <span className="text-accent">{todayResult.round1.toString().padStart(2, '0')}</span>
              ) : (
                "Waiting"
              )}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <p className="text-gray-400 text-xs mb-1">Round 2 (16:30)</p>
            <p className="font-mono font-bold text-xl text-white">
              {isLoading ? (
                "Loading..."
              ) : todayResult?.round2 !== undefined && todayResult.round2 !== null ? (
                <span className="text-accent">{todayResult.round2.toString().padStart(2, '0')}</span>
              ) : (
                "Waiting"
              )}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
