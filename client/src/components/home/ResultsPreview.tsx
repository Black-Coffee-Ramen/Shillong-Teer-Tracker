import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Result } from "@shared/schema";

export default function ResultsPreview() {
  const { data: results, isLoading, refetch } = useQuery<Result[]>({
    queryKey: ["/api/results"],
    refetchInterval: 60000, // Refetch every minute
  });
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayResult = results?.find(r => {
    const resultDate = new Date(r.date);
    resultDate.setHours(0, 0, 0, 0);
    return resultDate.getTime() === today.getTime();
  });
  
  return (
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
  );
}
