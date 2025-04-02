import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatTwoDigits } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Download, Upload, Plus, Save, Trash2, Award, AlertTriangle } from "lucide-react";

interface ResultEntry {
  date: string;
  round1: number | null;
  round2: number | null;
}

interface ProcessWinsResponse {
  resultId: number;
  resultDate: string;
  totalWins: number;
  winDetails: any[];
}

export default function ResultsManager() {
  const { toast } = useToast();
  const [newResult, setNewResult] = useState<ResultEntry>({
    date: new Date().toISOString().split('T')[0],
    round1: null,
    round2: null
  });
  const [isImporting, setIsImporting] = useState(false);
  const [csvData, setCsvData] = useState<string>("");
  const [processingWins, setProcessingWins] = useState(false);
  
  // Fetch all results
  const { data: results, isLoading } = useQuery<any[]>({
    queryKey: ["/api/results"],
  });
  
  // Update Result Mutation
  const updateResultMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<ResultEntry> }) => {
      return await apiRequest('PATCH', `/api/results/${data.id}`, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/results"] });
      toast({
        title: "Success",
        description: "Result updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update result",
      });
    }
  });
  
  // Create Result Mutation
  const createResultMutation = useMutation({
    mutationFn: async (data: ResultEntry) => {
      // Ensure we're sending a proper date format for the server
      const formattedData = {
        ...data,
        date: new Date(data.date).toISOString()
      };
      return await apiRequest('POST', "/api/results", formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/results"] });
      toast({
        title: "Success",
        description: "New result created successfully",
      });
      setNewResult({
        date: new Date().toISOString().split('T')[0],
        round1: null,
        round2: null
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create result",
      });
      console.error("Result creation error:", error);
    }
  });
  
  // Handle Result Update
  const handleUpdateResult = (id: number, updates: Partial<ResultEntry>) => {
    updateResultMutation.mutate({ id, updates });
  };
  
  // Handle New Result Creation
  const handleCreateResult = () => {
    if (!newResult.date) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Date is required",
      });
      return;
    }
    
    createResultMutation.mutate(newResult);
  };
  
  // Handle CSV Import
  const handleCsvImport = () => {
    try {
      const lines = csvData.trim().split('\n');
      
      // Skip header if present
      const startIndex = lines[0].includes('Date') || lines[0].includes('F/R') ? 1 : 0;
      
      const importPromises = [];
      
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Try to parse the CSV line (supporting both comma and tab separators)
        const parts = line.includes(',') ? line.split(',') : line.split('\t');
        
        if (parts.length >= 3) {
          // Parse date (expecting DD-MM-YYYY format)
          let dateStr = parts[0].trim();
          let dateObj: Date;
          
          // Handle different date formats
          if (dateStr.includes('-') && dateStr.split('-')[0].length === 2) {
            // DD-MM-YYYY format
            const [day, month, year] = dateStr.split('-');
            dateObj = new Date(`${year}-${month}-${day}`);
          } else if (dateStr.includes('/')) {
            // DD/MM/YYYY format
            const [day, month, year] = dateStr.split('/');
            dateObj = new Date(`${year}-${month}-${day}`);
          } else {
            // Assume ISO format
            dateObj = new Date(dateStr);
          }
          
          // Check if date is valid
          if (isNaN(dateObj.getTime())) {
            throw new Error(`Invalid date format: ${dateStr}`);
          }
          
          // Parse round values
          const round1 = parseInt(parts[1].trim());
          const round2 = parseInt(parts[2].trim());
          
          if (isNaN(round1) || isNaN(round2)) {
            throw new Error(`Invalid number format on line ${i + 1}`);
          }
          
          // Format date to ISO
          const isoDate = dateObj.toISOString();
          
          // Find if result already exists for this date
          const existingResult = results?.find(r => {
            const resultDate = new Date(r.date);
            return resultDate.toDateString() === dateObj.toDateString();
          });
          
          if (existingResult) {
            // Update existing result
            importPromises.push(
              updateResultMutation.mutateAsync({ 
                id: existingResult.id, 
                updates: { round1, round2 } 
              })
            );
          } else {
            // Create new result
            importPromises.push(
              createResultMutation.mutateAsync({ 
                date: isoDate, 
                round1, 
                round2 
              })
            );
          }
        }
      }
      
      // Process all import operations
      Promise.all(importPromises)
        .then(() => {
          toast({
            title: "Import Complete",
            description: `Successfully imported ${importPromises.length} results`,
          });
          setCsvData("");
          setIsImporting(false);
        })
        .catch(error => {
          toast({
            variant: "destructive",
            title: "Import Error",
            description: error.message,
          });
        });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Import Error",
        description: error instanceof Error ? error.message : "Failed to parse CSV data",
      });
    }
  };
  
  // Download results as CSV
  const handleExportCsv = () => {
    if (!results || results.length === 0) {
      toast({
        variant: "destructive",
        title: "Export Error",
        description: "No results to export",
      });
      return;
    }
    
    // Create CSV content
    let csvContent = "Date\tF/R\tS/R\n";
    
    results
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .forEach(result => {
        const date = new Date(result.date);
        // Format date as DD-MM-YYYY
        const formattedDate = `${formatTwoDigits(date.getDate())}-${formatTwoDigits(date.getMonth() + 1)}-${date.getFullYear()}`;
        const round1 = result.round1 !== null ? formatTwoDigits(result.round1) : "--";
        const round2 = result.round2 !== null ? formatTwoDigits(result.round2) : "--";
        
        csvContent += `${formattedDate}\t${round1}\t${round2}\n`;
      });
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'teer_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Process Wins Mutation
  const processWinsMutation = useMutation<ProcessWinsResponse, Error, number>({
    mutationFn: async (resultId: number) => {
      return await apiRequest('POST', "/api/process-wins", { resultId });
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Processed ${data.totalWins} wins successfully`,
      });
      setProcessingWins(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to process wins",
      });
      setProcessingWins(false);
    }
  });

  // Handle Process Wins
  const handleProcessWins = (resultId: number) => {
    if (!resultId) return;
    
    setProcessingWins(true);
    processWinsMutation.mutate(resultId);
  };

  // Format date for display
  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${formatTwoDigits(date.getDate())}-${formatTwoDigits(date.getMonth() + 1)}-${date.getFullYear()}`;
  };
  
  return (
    <div className="bg-secondary rounded-xl p-4 mb-6 shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white text-lg font-semibold">Teer Results Manager</h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportCsv}
            className="text-xs"
          >
            <Download className="h-3 w-3 mr-1" /> Export CSV
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsImporting(!isImporting)}
            className="text-xs"
          >
            <Upload className="h-3 w-3 mr-1" /> {isImporting ? "Cancel Import" : "Import CSV"}
          </Button>
        </div>
      </div>
      
      {/* CSV Import Section */}
      {isImporting && (
        <div className="bg-gray-800 p-3 rounded-md mb-4">
          <h3 className="text-white text-sm font-medium mb-2">Import Results from CSV</h3>
          <p className="text-gray-400 text-xs mb-2">
            Paste CSV data with columns: Date, F/R, S/R (formats: DD-MM-YYYY or YYYY-MM-DD)
          </p>
          <textarea 
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            className="w-full bg-gray-900 text-white rounded-md p-2 text-sm font-mono h-24 mb-2"
            placeholder="Date,F/R,S/R"
          />
          <Button
            onClick={handleCsvImport}
            size="sm"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={!csvData.trim()}
          >
            <Save className="h-3 w-3 mr-1" /> Import Data
          </Button>
        </div>
      )}
      
      {/* Add New Result Section */}
      <div className="bg-gray-800 p-3 rounded-md mb-4">
        <h3 className="text-white text-sm font-medium mb-2">Add New Result</h3>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-gray-400 text-xs">Date</label>
            <Input 
              type="date"
              value={newResult.date}
              onChange={(e) => setNewResult({...newResult, date: e.target.value})}
              className="bg-gray-900 text-white"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs">First Round</label>
            <Input 
              type="number"
              min="0"
              max="99"
              value={newResult.round1 === null ? '' : newResult.round1}
              onChange={(e) => setNewResult({...newResult, round1: e.target.value ? parseInt(e.target.value) : null})}
              className="bg-gray-900 text-white"
              placeholder="--"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs">Second Round</label>
            <Input 
              type="number"
              min="0"
              max="99"
              value={newResult.round2 === null ? '' : newResult.round2}
              onChange={(e) => setNewResult({...newResult, round2: e.target.value ? parseInt(e.target.value) : null})}
              className="bg-gray-900 text-white"
              placeholder="--"
            />
          </div>
        </div>
        <Button
          onClick={handleCreateResult}
          className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
          disabled={!newResult.date}
        >
          <Plus className="h-4 w-4 mr-1" /> Add Result
        </Button>
      </div>
      
      {/* Results Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-700">
              <TableHead className="text-white">Date</TableHead>
              <TableHead className="text-white">First Round</TableHead>
              <TableHead className="text-white">Second Round</TableHead>
              <TableHead className="text-white text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-400 py-4">
                  Loading results...
                </TableCell>
              </TableRow>
            ) : !results || results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-400 py-4">
                  No results found
                </TableCell>
              </TableRow>
            ) : (
              results
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(result => (
                  <TableRow key={result.id} className="border-gray-700">
                    <TableCell className="text-white">
                      {formatDisplayDate(result.date)}
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number"
                        min="0"
                        max="99"
                        className="w-16 bg-gray-800 text-white"
                        value={result.round1 === null ? '' : result.round1}
                        onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value) : null;
                          handleUpdateResult(result.id, { round1: value });
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number"
                        min="0"
                        max="99"
                        className="w-16 bg-gray-800 text-white"
                        value={result.round2 === null ? '' : result.round2}
                        onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value) : null;
                          handleUpdateResult(result.id, { round2: value });
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        {/* Process Wins Button - only show if result has at least one round */}
                        {(result.round1 !== null || result.round2 !== null) && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-green-500 hover:text-green-400 hover:bg-green-950/30"
                            onClick={() => handleProcessWins(result.id)}
                            disabled={processingWins}
                          >
                            <Award className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Delete button (not implemented) */}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-500 hover:text-red-400 hover:bg-red-950/30"
                          onClick={() => {
                            toast({
                              title: "Info",
                              description: "Delete functionality not implemented yet",
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}