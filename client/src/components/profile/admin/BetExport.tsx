import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addDays } from "date-fns";
import { Calendar as CalendarIcon, Download, FileDown, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function BetExport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [exportFormat, setExportFormat] = useState<string>("json");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastExportData, setLastExportData] = useState<{count: number, dateRange: {start: string, end: string}} | null>(null);

  // Check if user is admin
  const isAdmin = user?.username === "admin";
  
  // Set defaults for this week
  const setThisWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Monday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
    endOfWeek.setHours(23, 59, 59, 999);
    
    setStartDate(startOfWeek);
    setEndDate(endOfWeek);
  };
  
  // Set last 7 days
  const setLast7Days = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    
    setStartDate(sevenDaysAgo);
    setEndDate(today);
  };
  
  // Set last 30 days
  const setLast30Days = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    
    setStartDate(thirtyDaysAgo);
    setEndDate(today);
  };
  
  // Preview export data
  const previewExport = async () => {
    setIsLoading(true);
    try {
      // Construct query parameters
      const params = new URLSearchParams();
      
      if (startDate) {
        // Format date as YYYY-MM-DD to ensure consistent parsing
        const formattedStartDate = startDate.toISOString().split('T')[0];
        params.append("startDate", formattedStartDate);
      }
      
      if (endDate) {
        // Format date as YYYY-MM-DD to ensure consistent parsing
        const formattedEndDate = endDate.toISOString().split('T')[0];
        params.append("endDate", formattedEndDate);
      }
      
      params.append("format", "json");
      
      // Fetch preview data
      const response = await fetch(`/api/betting/export?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch export data');
      }
      
      const data = await response.json();
      setLastExportData(data);
      
      toast({
        title: "Export Preview",
        description: `Found ${data.count} bets in selected date range.`,
      });
    } catch (error) {
      console.error("Export preview error:", error);
      toast({
        title: "Export Preview Failed",
        description: "Could not preview export data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle export
  const handleExport = () => {
    // Construct query parameters
    const params = new URLSearchParams();
    
    if (startDate) {
      // Format date as YYYY-MM-DD to ensure consistent parsing
      const formattedStartDate = startDate.toISOString().split('T')[0];
      console.log("Exporting with start date:", formattedStartDate);
      params.append("startDate", formattedStartDate);
    }
    
    if (endDate) {
      // Format date as YYYY-MM-DD to ensure consistent parsing
      const formattedEndDate = endDate.toISOString().split('T')[0];
      console.log("Exporting with end date:", formattedEndDate);
      params.append("endDate", formattedEndDate);
    }
    
    params.append("format", exportFormat);
    
    // Create download URL
    const downloadUrl = `/api/betting/export?${params.toString()}`;
    console.log("Export URL:", downloadUrl);
    
    // Open in new tab or trigger download
    window.open(downloadUrl, "_blank");
    
    toast({
      title: "Export Started",
      description: "Your export has been initiated. Check your downloads folder.",
    });
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data Export</CardTitle>
          <CardDescription>Export betting data for analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-destructive p-4 border border-destructive/20 rounded-md bg-destructive/10">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>Administrator access required</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Export</CardTitle>
        <CardDescription>Export betting data for record keeping and analysis</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Date Presets */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Quick Selections</label>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={setThisWeek}>This Week</Button>
            <Button variant="outline" size="sm" onClick={setLast7Days}>Last 7 Days</Button>
            <Button variant="outline" size="sm" onClick={setLast30Days}>Last 30 Days</Button>
          </div>
        </div>
        
        {/* Date Range Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Date Range</label>
          <div className="flex flex-wrap gap-4">
            {/* Start Date Selector */}
            <div className="flex-1 min-w-[140px]">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Start date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date Selector */}
            <div className="flex-1 min-w-[140px]">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>End date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    disabled={(date) => 
                      startDate ? date < startDate : false
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Leave empty to export all data
          </p>
        </div>

        {/* Export Format */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Export Format</label>
          <Select value={exportFormat} onValueChange={setExportFormat}>
            <SelectTrigger>
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Format</SelectLabel>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        
        {/* Preview Results */}
        {lastExportData && (
          <div className="p-4 bg-muted rounded-md">
            <h3 className="font-medium mb-2">Export Preview</h3>
            <p>Date Range: {startDate ? format(startDate, "PP") : "All time"} to {endDate ? format(endDate, "PP") : "Present"}</p>
            <p>Total Bets: <span className="font-semibold">{lastExportData.count}</span></p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2 w-full">
          <Button 
            variant="outline"
            onClick={previewExport}
            disabled={isLoading}
          >
            {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Preview Count
          </Button>
          <Button 
            onClick={handleExport}
            disabled={isLoading}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
        {/* User hint */}
        <p className="text-xs text-muted-foreground mt-2">
          Preview first to confirm data availability before exporting
        </p>
      </CardFooter>
    </Card>
  );
}