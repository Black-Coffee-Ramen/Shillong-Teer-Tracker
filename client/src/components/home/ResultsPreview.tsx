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
        <div className="glass-panel border border-amber-500/30 rounded-lg p-5 mt-4 text-center shadow-md">
          <div className="inline-flex items-center justify-center px-3 py-1 mb-3 bg-amber-500/10 rounded-full border border-amber-500/30">
            <Calendar className="h-4 w-4 text-amber-500 mr-2" />
            <p className="text-amber-500 text-sm font-medium">Sunday - No Results Today</p>
          </div>
          <p className="text-muted-foreground text-xs mb-4">Shillong Teer does not operate on Sundays</p>
          
          {/* Show previous day's results for reference */}
          {yesterdayResult && (
            <div className="bg-background/30 rounded-lg p-4 shadow-inner">
              <p className="text-foreground text-sm font-medium mb-3">
                Saturday's Results 
                <span className="text-muted-foreground ml-1">
                  ({format(new Date(yesterdayResult.date), 'dd/MM')})
                </span>
              </p>
              <div className="flex justify-center gap-4">
                <div className="glass-panel rounded-lg px-4 py-2 shadow-sm">
                  <span className="text-xs text-muted-foreground block mb-1">Round 1</span>
                  <span className="font-mono text-primary text-lg font-bold">
                    {yesterdayResult.round1?.toString().padStart(2, '0') || '--'}
                  </span>
                </div>
                <div className="glass-panel rounded-lg px-4 py-2 shadow-sm">
                  <span className="text-xs text-muted-foreground block mb-1">Round 2</span>
                  <span className="font-mono text-primary text-lg font-bold">
                    {yesterdayResult.round2?.toString().padStart(2, '0') || '--'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="rounded-xl p-4 text-center glass-panel shadow-md relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
            <div className="relative">
              <p className="text-muted-foreground text-xs mb-2 flex items-center justify-center">
                <Clock className="h-3 w-3 mr-1" />
                Round 1 (15:30)
              </p>
              <div className="font-mono font-bold text-2xl">
                {isLoading ? (
                  <div className="animate-pulse bg-primary/10 rounded h-8 w-16 mx-auto"></div>
                ) : todayResult?.round1 !== undefined && todayResult.round1 !== null ? (
                  <span className="text-primary">{todayResult.round1.toString().padStart(2, '0')}</span>
                ) : (
                  <span className="text-amber-500 text-xl">Waiting</span>
                )}
              </div>
            </div>
          </div>
          <div className="rounded-xl p-4 text-center glass-panel shadow-md relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
            <div className="relative">
              <p className="text-muted-foreground text-xs mb-2 flex items-center justify-center">
                <Clock className="h-3 w-3 mr-1" />
                Round 2 (16:30)
              </p>
              <div className="font-mono font-bold text-2xl">
                {isLoading ? (
                  <div className="animate-pulse bg-primary/10 rounded h-8 w-16 mx-auto"></div>
                ) : todayResult?.round2 !== undefined && todayResult.round2 !== null ? (
                  <span className="text-primary">{todayResult.round2.toString().padStart(2, '0')}</span>
                ) : (
                  <span className="text-amber-500 text-xl">Waiting</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
