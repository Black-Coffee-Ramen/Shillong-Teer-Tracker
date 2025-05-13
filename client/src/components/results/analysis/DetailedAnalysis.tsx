import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Result } from "@shared/schema";
import { format, subDays } from "date-fns";
import { formatTwoDigits } from "@/lib/utils";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { ChevronLeft, Calendar, BarChart2, HashIcon, TrendingUp } from "lucide-react";

interface DetailedAnalysisProps {
  onBack: () => void;
}

export default function DetailedAnalysis({ onBack }: DetailedAnalysisProps) {
  const [selectedTab, setSelectedTab] = useState("frequency");
  const [timeRange, setTimeRange] = useState<30 | 60 | 90>(30);
  
  const { data: results, isLoading } = useQuery<Result[]>({
    queryKey: ["/api/results"],
  });
  
  // Get results within the selected time range
  const filteredResults = useMemo(() => {
    if (!results) return [];
    
    const cutoffDate = subDays(new Date(), timeRange);
    return results.filter(result => {
      const resultDate = new Date(result.date);
      return resultDate >= cutoffDate;
    });
  }, [results, timeRange]);
  
  // Calculate number frequency data
  const frequencyData = useMemo(() => {
    if (!filteredResults.length) return [];
    
    // Create array for all 100 numbers (0-99)
    const numberCounts = Array(100).fill(0).map((_, idx) => ({ 
      number: idx, 
      count: 0,
      formattedNumber: formatTwoDigits(idx)
    }));
    
    // Count occurrences of each number
    filteredResults.forEach(result => {
      if (result.round1 !== null && result.round1 !== undefined) {
        numberCounts[result.round1].count += 1;
      }
      if (result.round2 !== null && result.round2 !== undefined) {
        numberCounts[result.round2].count += 1;
      }
    });
    
    // Sort by count (descending)
    return [...numberCounts].sort((a, b) => b.count - a.count);
  }, [filteredResults]);
  
  // Calculate digit frequency (0-9 for each position)
  const digitFrequencyData = useMemo(() => {
    if (!filteredResults.length) return { first: [], second: [] };
    
    // Create arrays for first and second digits (0-9)
    const firstDigitCounts = Array(10).fill(0).map((_, idx) => ({ 
      digit: idx, 
      count: 0 
    }));
    const secondDigitCounts = Array(10).fill(0).map((_, idx) => ({ 
      digit: idx, 
      count: 0 
    }));
    
    // Count occurrences of each digit
    filteredResults.forEach(result => {
      if (result.round1 !== null && result.round1 !== undefined) {
        const firstDigit = Math.floor(result.round1 / 10);
        const secondDigit = result.round1 % 10;
        firstDigitCounts[firstDigit].count += 1;
        secondDigitCounts[secondDigit].count += 1;
      }
      if (result.round2 !== null && result.round2 !== undefined) {
        const firstDigit = Math.floor(result.round2 / 10);
        const secondDigit = result.round2 % 10;
        firstDigitCounts[firstDigit].count += 1;
        secondDigitCounts[secondDigit].count += 1;
      }
    });
    
    return {
      first: firstDigitCounts,
      second: secondDigitCounts
    };
  }, [filteredResults]);
  
  // Calculate pattern data (even/odd, high/low)
  const patternData = useMemo(() => {
    if (!filteredResults.length) return { evenOdd: [], highLow: [] };
    
    // Initialize counters
    const patterns = {
      evenEven: 0, 
      evenOdd: 0, 
      oddEven: 0, 
      oddOdd: 0,
      lowLow: 0,   // both digits < 5
      lowHigh: 0,  // first < 5, second >= 5
      highLow: 0,  // first >= 5, second < 5
      highHigh: 0  // both digits >= 5
    };
    
    // Count pattern occurrences
    filteredResults.forEach(result => {
      if (result.round1 !== null && result.round1 !== undefined) {
        const firstDigit = Math.floor(result.round1 / 10);
        const secondDigit = result.round1 % 10;
        
        // Even/Odd patterns
        if (firstDigit % 2 === 0 && secondDigit % 2 === 0) patterns.evenEven++;
        if (firstDigit % 2 === 0 && secondDigit % 2 !== 0) patterns.evenOdd++;
        if (firstDigit % 2 !== 0 && secondDigit % 2 === 0) patterns.oddEven++;
        if (firstDigit % 2 !== 0 && secondDigit % 2 !== 0) patterns.oddOdd++;
        
        // High/Low patterns
        if (firstDigit < 5 && secondDigit < 5) patterns.lowLow++;
        if (firstDigit < 5 && secondDigit >= 5) patterns.lowHigh++;
        if (firstDigit >= 5 && secondDigit < 5) patterns.highLow++;
        if (firstDigit >= 5 && secondDigit >= 5) patterns.highHigh++;
      }
      
      if (result.round2 !== null && result.round2 !== undefined) {
        const firstDigit = Math.floor(result.round2 / 10);
        const secondDigit = result.round2 % 10;
        
        // Even/Odd patterns
        if (firstDigit % 2 === 0 && secondDigit % 2 === 0) patterns.evenEven++;
        if (firstDigit % 2 === 0 && secondDigit % 2 !== 0) patterns.evenOdd++;
        if (firstDigit % 2 !== 0 && secondDigit % 2 === 0) patterns.oddEven++;
        if (firstDigit % 2 !== 0 && secondDigit % 2 !== 0) patterns.oddOdd++;
        
        // High/Low patterns
        if (firstDigit < 5 && secondDigit < 5) patterns.lowLow++;
        if (firstDigit < 5 && secondDigit >= 5) patterns.lowHigh++;
        if (firstDigit >= 5 && secondDigit < 5) patterns.highLow++;
        if (firstDigit >= 5 && secondDigit >= 5) patterns.highHigh++;
      }
    });
    
    // Format data for charts
    const evenOddData = [
      { name: 'Even-Even', value: patterns.evenEven, color: '#3B82F6' },
      { name: 'Even-Odd', value: patterns.evenOdd, color: '#10B981' },
      { name: 'Odd-Even', value: patterns.oddEven, color: '#F59E0B' },
      { name: 'Odd-Odd', value: patterns.oddOdd, color: '#EF4444' }
    ];
    
    const highLowData = [
      { name: 'Low-Low', value: patterns.lowLow, color: '#6366F1' },
      { name: 'Low-High', value: patterns.lowHigh, color: '#8B5CF6' },
      { name: 'High-Low', value: patterns.highLow, color: '#EC4899' },
      { name: 'High-High', value: patterns.highHigh, color: '#F43F5E' }
    ];
    
    return { evenOdd: evenOddData, highLow: highLowData };
  }, [filteredResults]);
  
  // Calculate trends over time
  const trendData = useMemo(() => {
    if (!filteredResults.length) return [];
    
    // Sort results by date
    const sortedResults = [...filteredResults]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Calculate moving averages and create trend data
    const trendPoints: any[] = [];
    
    // For simplicity, use a 5-day moving window if enough data
    const windowSize = Math.min(5, Math.floor(sortedResults.length / 2));
    
    if (windowSize > 0) {
      for (let i = windowSize - 1; i < sortedResults.length; i++) {
        const windowSum = { round1Total: 0, round2Total: 0, validCount1: 0, validCount2: 0 };
        
        // Calculate sum for the window
        for (let j = i - (windowSize - 1); j <= i; j++) {
          if (sortedResults[j]?.round1 != null) { // != null checks for both null and undefined
            windowSum.round1Total += sortedResults[j].round1!; // Non-null assertion
            windowSum.validCount1++;
          }
          if (sortedResults[j]?.round2 != null) { // != null checks for both null and undefined
            windowSum.round2Total += sortedResults[j].round2!; // Non-null assertion
            windowSum.validCount2++;
          }
        }
        
        // Calculate average for the window
        const date = new Date(sortedResults[i].date);
        const round1Avg = windowSum.validCount1 > 0 ? 
          Math.round(windowSum.round1Total / windowSum.validCount1) : null;
        const round2Avg = windowSum.validCount2 > 0 ? 
          Math.round(windowSum.round2Total / windowSum.validCount2) : null;
        
        trendPoints.push({
          date: format(date, 'MM/dd'),
          round1: sortedResults[i].round1 !== null && sortedResults[i].round1 !== undefined ? sortedResults[i].round1 : null,
          round2: sortedResults[i].round2 !== null && sortedResults[i].round2 !== undefined ? sortedResults[i].round2 : null,
          round1Avg,
          round2Avg
        });
      }
    }
    
    return trendPoints;
  }, [filteredResults]);
  
  const renderFrequencyTab = () => (
    <div>
      <h3 className="text-gray-800 font-medium mb-3">Number Frequency Analysis</h3>
      <p className="text-gray-600 text-sm mb-4">
        Shows how often each number has appeared in the last {timeRange} days of results.
      </p>
      
      <div className="bg-white rounded-lg p-4 mb-5 border border-gray-200 shadow-sm">
        <h4 className="text-gray-800 text-sm mb-4">Most Frequent Numbers</h4>
        
        {isLoading ? (
          <div className="text-center text-gray-500 py-4">Loading data...</div>
        ) : frequencyData.length > 0 ? (
          <div className="grid grid-cols-5 gap-2 mb-3">
            {frequencyData.slice(0, 10).map(item => (
              <div key={item.number} className="bg-gray-50 p-2 rounded-md text-center border border-gray-200">
                <div className="font-mono text-lg text-gray-800 mb-1">{item.formattedNumber}</div>
                <div className="text-xs text-purple-700">{item.count}x</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-4">No data available</div>
        )}
        
        <h4 className="text-gray-800 text-sm mt-5 mb-3">Number Distribution</h4>
        <div className="w-full h-64">
          {frequencyData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={frequencyData.filter(n => n.count > 0).slice(0, 20)}
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="formattedNumber" 
                  tick={{ fill: '#6B7280' }}
                  interval={0}
                  fontSize={10}
                />
                <YAxis tick={{ fill: '#6B7280' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
                  labelStyle={{ color: '#374151' }}
                  itemStyle={{ color: '#374151' }}
                />
                <Bar dataKey="count" fill="#9333EA" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200 shadow-sm">
        <h4 className="text-gray-800 text-sm mb-3">Digit Analysis (First & Second Positions)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="text-gray-600 text-xs mb-2">First Digit (Tens)</h5>
            <div className="w-full h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={digitFrequencyData.first}
                  margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="digit" 
                    tick={{ fill: '#6B7280' }}
                  />
                  <YAxis tick={{ fill: '#6B7280' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
                    labelStyle={{ color: '#374151' }}
                    itemStyle={{ color: '#374151' }}
                  />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <h5 className="text-gray-600 text-xs mb-2">Second Digit (Units)</h5>
            <div className="w-full h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={digitFrequencyData.second}
                  margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="digit" 
                    tick={{ fill: '#6B7280' }}
                  />
                  <YAxis tick={{ fill: '#6B7280' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
                    labelStyle={{ color: '#374151' }}
                    itemStyle={{ color: '#374151' }}
                  />
                  <Bar dataKey="count" fill="#A855F7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderPatternTab = () => (
    <div>
      <h3 className="text-gray-800 font-medium mb-3">Pattern Analysis</h3>
      <p className="text-gray-600 text-sm mb-4">
        Examines recurring patterns in the Teer results over the last {timeRange} days.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <h4 className="text-gray-800 text-sm mb-3">Even/Odd Patterns</h4>
          <div className="w-full h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={patternData.evenOdd}
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#6B7280' }}
                />
                <YAxis tick={{ fill: '#6B7280' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
                  labelStyle={{ color: '#374151' }}
                  itemStyle={{ color: '#374151' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {patternData.evenOdd.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {patternData.evenOdd.map(item => (
              <div key={item.name} className="flex items-center">
                <div 
                  className="w-3 h-3 mr-2 rounded-sm" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-xs text-gray-700">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <h4 className="text-gray-800 text-sm mb-3">High/Low Patterns</h4>
          <div className="w-full h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={patternData.highLow}
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#6B7280' }}
                />
                <YAxis tick={{ fill: '#6B7280' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
                  labelStyle={{ color: '#374151' }}
                  itemStyle={{ color: '#374151' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {patternData.highLow.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {patternData.highLow.map(item => (
              <div key={item.name} className="flex items-center">
                <div 
                  className="w-3 h-3 mr-2 rounded-sm" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-xs text-gray-700">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200 shadow-sm">
        <h4 className="text-gray-800 text-sm mb-3">Pattern Tips</h4>
        <ul className="text-gray-700 text-sm space-y-2">
          <li>• <span className="text-purple-700 font-medium">Even-Even/Odd-Odd</span>: Both digits share the same parity (both even or both odd)</li>
          <li>• <span className="text-purple-700 font-medium">Low-Low</span>: Both digits are below 5 (0-4)</li>
          <li>• <span className="text-purple-700 font-medium">High-High</span>: Both digits are 5 or above (5-9)</li>
          <li>• Look for patterns that occur less frequently, as they may be due for an appearance</li>
        </ul>
      </div>
    </div>
  );
  
  const renderTrendTab = () => (
    <div>
      <h3 className="text-gray-800 font-medium mb-3">Trend Analysis</h3>
      <p className="text-gray-600 text-sm mb-4">
        Tracks how Teer results have changed over time in the last {timeRange} days.
      </p>
      
      <div className="bg-white rounded-lg p-4 mb-5 border border-gray-200 shadow-sm">
        <h4 className="text-gray-800 text-sm mb-4">Result Trends</h4>
        
        {trendData.length > 0 ? (
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={trendData.slice(-14)} // Show last 14 days
                margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#6B7280' }}
                  interval={1}
                  angle={-45}
                  textAnchor="end"
                  height={50}
                />
                <YAxis tick={{ fill: '#6B7280' }} domain={[0, 99]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
                  labelStyle={{ color: '#374151' }}
                  itemStyle={{ color: '#374151' }}
                />
                <Legend wrapperStyle={{ paddingTop: 10 }} />
                <Bar name="Round 1" dataKey="round1" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                <Bar name="Round 2" dataKey="round2" fill="#A855F7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-4">
            Not enough data available for trend analysis
          </div>
        )}
        
        <div className="mt-5">
          <h4 className="text-gray-800 text-sm mb-3">Trend Insights</h4>
          <ul className="text-gray-700 text-sm space-y-2">
            <li>• <span className="text-purple-700">Look for numbers</span> that have been consistently high or low recently</li>
            <li>• <span className="text-purple-700">Watch for alternate patterns</span> between rounds 1 and 2</li>
            <li>• <span className="text-purple-700">Numbers that haven't appeared</span> in several days might be due</li>
          </ul>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-200">
      <div className="flex items-center mb-5">
        <button 
          onClick={onBack}
          className="flex items-center text-gray-800 hover:text-purple-700 mr-3"
        >
          <ChevronLeft className="h-5 w-5" />
          <span>Back</span>
        </button>
        <h2 className="text-gray-800 font-poppins font-semibold">Detailed Result Analysis</h2>
      </div>
      
      <div className="mb-4">
        <div className="bg-gray-50 rounded-md p-2 flex justify-between items-center mb-4 border border-gray-200">
          <div className="text-purple-700 flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            <span className="text-sm">Time Range:</span>
          </div>
          <div className="flex space-x-1">
            {[30, 60, 90].map(days => (
              <button
                key={days}
                onClick={() => setTimeRange(days as 30 | 60 | 90)}
                className={`px-3 py-1 rounded-md text-xs ${
                  timeRange === days
                    ? 'bg-purple-700 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {days} Days
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="frequency" onValueChange={value => setSelectedTab(value as any)}>
        <TabsList className="w-full bg-gray-100 mb-4 border border-gray-200">
          <TabsTrigger value="frequency" className="flex-1 data-[state=active]:bg-purple-700 data-[state=active]:text-white">
            <BarChart2 className="h-4 w-4 mr-1" />
            <span>Frequency</span>
          </TabsTrigger>
          <TabsTrigger value="pattern" className="flex-1 data-[state=active]:bg-purple-700 data-[state=active]:text-white">
            <HashIcon className="h-4 w-4 mr-1" />
            <span>Patterns</span>
          </TabsTrigger>
          <TabsTrigger value="trend" className="flex-1 data-[state=active]:bg-purple-700 data-[state=active]:text-white">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span>Trends</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="frequency">
          {renderFrequencyTab()}
        </TabsContent>
        
        <TabsContent value="pattern">
          {renderPatternTab()}
        </TabsContent>
        
        <TabsContent value="trend">
          {renderTrendTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
}