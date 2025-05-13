import { Calendar } from "lucide-react";
import ResultsTable from "@/components/results/ResultsTable";

export default function ResultsPage() {
  return (
    <div className="py-4">
      <div className="mb-6">
        <h1 className="text-gray-900 flex items-center text-2xl font-semibold mb-2">
          <Calendar className="mr-2 h-6 w-6 text-primary" /> 
          Results
        </h1>
        <p className="text-gray-600">
          View the latest Shillong Teer results and historical data
        </p>
      </div>
      
      <ResultsTable />
    </div>
  );
}
