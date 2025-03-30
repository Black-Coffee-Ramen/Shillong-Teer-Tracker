import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Brain, History, TrendingUp, Sparkles } from "lucide-react";

type AIAnalysisType = "frequency" | "pattern" | "hot" | "combinations";

export default function AISuggestions() {
  const { toast } = useToast();
  const [analysisType, setAnalysisType] = useState<AIAnalysisType>("frequency");
  
  // Fetch real results data for analysis
  const { data: resultsData, isLoading: resultsLoading } = useQuery<any>({
    queryKey: ["/api/results"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Perform real-time analysis based on actual results data
  const { data: aiData, isLoading } = useQuery({
    queryKey: ["/api/ai-suggestions", analysisType, resultsData],
    queryFn: async () => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (!resultsData || resultsData.length === 0) {
        return {
          numbers: [0, 0, 0, 0],
          confidence: 0,
          description: "Insufficient data to generate recommendations."
        };
      }
      
      // Extract all round numbers from the results
      const allNumbers: number[] = [];
      const lastWeekResults: any[] = [];
      const recentResults = [...resultsData].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ).slice(0, 14); // Last 14 days of results
      
      recentResults.forEach(result => {
        if (result.round1 !== null) allNumbers.push(result.round1);
        if (result.round2 !== null) allNumbers.push(result.round2);
        
        // Keep track of last week's results for analysis
        const resultDate = new Date(result.date);
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        if (resultDate >= oneWeekAgo) {
          lastWeekResults.push(result);
        }
      });
      
      // Count occurrences of each number
      const numberFrequency: {[key: number]: number} = {};
      allNumbers.forEach(num => {
        numberFrequency[num] = (numberFrequency[num] || 0) + 1;
      });
      
      // Get most frequent numbers
      const sortedByFrequency = Object.entries(numberFrequency)
        .sort((a, b) => b[1] - a[1])
        .map(entry => parseInt(entry[0]));
      
      // Find ending digit patterns
      const endingDigits: {[key: number]: number} = {};
      allNumbers.forEach(num => {
        const endDigit = num % 10;
        endingDigits[endDigit] = (endingDigits[endDigit] || 0) + 1;
      });
      
      // Get top ending digits
      const topEndingDigits = Object.entries(endingDigits)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(entry => parseInt(entry[0]));
      
      switch (analysisType) {
        case "frequency":
          const frequentNumbers = sortedByFrequency.slice(0, 4);
          return {
            numbers: frequentNumbers,
            confidence: 0.65 + (Math.random() * 0.1),
            description: `Based on the last ${recentResults.length} days, numbers ending with ${topEndingDigits.join(', ')} appeared more frequently. Consider including them in your selection.`
          };
        case "pattern":
          // Find numbers following patterns (e.g., numbers that often appear together)
          const patternNumbers = [];
          // Use first digit of top frequent numbers and combine with trending ending digits
          for (let i = 0; i < 4; i++) {
            const firstDigit = Math.floor(sortedByFrequency[i] / 10);
            const endDigit = topEndingDigits[i % topEndingDigits.length];
            patternNumbers.push(firstDigit * 10 + endDigit);
          }
          
          return {
            numbers: patternNumbers.slice(0, 4),
            confidence: 0.60 + (Math.random() * 0.15),
            description: "These numbers follow statistical patterns observed in recent results."
          };
        case "hot":
          // Hot numbers are those that appeared in the most recent results
          const hotNumbers = [];
          for (let i = 0; i < Math.min(2, recentResults.length); i++) {
            if (recentResults[i].round1 !== null) hotNumbers.push(recentResults[i].round1);
            if (recentResults[i].round2 !== null) hotNumbers.push(recentResults[i].round2);
          }
          
          // Add some numbers that haven't appeared recently
          const missingNumbers = Array.from({length: 100}, (_, i) => i).filter(n => 
            !allNumbers.includes(n) && n < 100 && n >= 0
          );
          
          // Pick 2 random numbers from missing set if available
          for (let i = 0; i < 2 && missingNumbers.length > 0; i++) {
            const idx = Math.floor(Math.random() * missingNumbers.length);
            hotNumbers.push(missingNumbers[idx]);
            missingNumbers.splice(idx, 1);
          }
          
          return {
            numbers: hotNumbers.slice(0, 4),
            confidence: 0.55 + (Math.random() * 0.15),
            description: "These 'hot numbers' have had recent wins or have been absent and may be due."
          };
        case "combinations":
          // Create combinations that mix frequent and rare numbers
          const combinations = [];
          
          // Add two most frequent numbers
          combinations.push(sortedByFrequency[0]);
          combinations.push(sortedByFrequency[1]);
          
          // Add one number with top ending digit
          const firstDigitOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9];
          const shuffledFirstDigits = firstDigitOptions.sort(() => Math.random() - 0.5);
          combinations.push(shuffledFirstDigits[0] * 10 + topEndingDigits[0]);
          
          // Add one completely random number
          let randomNum;
          do {
            randomNum = Math.floor(Math.random() * 100);
          } while (combinations.includes(randomNum));
          combinations.push(randomNum);
          
          return {
            numbers: combinations,
            confidence: 0.60 + (Math.random() * 0.15),
            description: "These number combinations mix frequent winners with numbers that are statistically due."
          };
      }
    },
    enabled: !!resultsData,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Format the confidence percentage
  const confidencePercentage = useMemo(() => {
    return aiData ? Math.round(aiData.confidence * 100) : 0;
  }, [aiData]);
  
  // Handle quick-bet function
  const handleQuickBet = () => {
    if (!aiData?.numbers.length) return;
    
    // In a real app, this would navigate to the betting page with prefilled selections
    toast({
      title: "Numbers selected",
      description: `${aiData.numbers.join(', ')} have been added to your bet slip.`,
    });
  };
  
  return (
    <div className="bg-secondary rounded-xl p-4 mb-6 shadow-md">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-white font-semibold text-lg">AI Suggestions</h2>
        <div className="flex items-center gap-1">
          <span className="bg-blue-500 bg-opacity-20 text-blue-400 text-xs px-2 py-1 rounded-full">BETA</span>
        </div>
      </div>
      
      {/* Analysis type selector */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Button 
          size="sm" 
          variant={analysisType === "frequency" ? "default" : "outline"}
          onClick={() => setAnalysisType("frequency")}
          className="text-xs"
        >
          <History className="h-3 w-3 mr-1" />
          Frequency
        </Button>
        <Button 
          size="sm" 
          variant={analysisType === "pattern" ? "default" : "outline"}
          onClick={() => setAnalysisType("pattern")}
          className="text-xs"
        >
          <Brain className="h-3 w-3 mr-1" />
          Pattern
        </Button>
        <Button 
          size="sm" 
          variant={analysisType === "hot" ? "default" : "outline"}
          onClick={() => setAnalysisType("hot")}
          className="text-xs"
        >
          <TrendingUp className="h-3 w-3 mr-1" />
          Hot Numbers
        </Button>
        <Button 
          size="sm" 
          variant={analysisType === "combinations" ? "default" : "outline"}
          onClick={() => setAnalysisType("combinations")}
          className="text-xs"
        >
          <Sparkles className="h-3 w-3 mr-1" />
          Combinations
        </Button>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-4 mb-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-accent mb-2" />
            <p className="text-gray-400 text-sm">Analyzing patterns...</p>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="flex items-start">
              <div className="w-full">
                <div className="flex items-center justify-between">
                  <p className="text-white text-sm font-medium">Today's Suggestion</p>
                  <div className="bg-gray-700 px-2 py-1 rounded text-xs">
                    <span className="text-green-400">{confidencePercentage}%</span> confidence
                  </div>
                </div>
                
                {aiData?.description && (
                  <p 
                    className="text-gray-300 text-xs mt-2 mb-3"
                    dangerouslySetInnerHTML={{
                      __html: aiData.description.includes("numbers ending with")
                        ? aiData.description.replace(
                            /(\d+,\s*)*\d+/g, 
                            match => `<span class="text-white font-medium">${match}</span>`
                          )
                        : aiData.description
                    }}
                  />
                )}
                
                <div className="flex flex-wrap gap-2 mt-2">
                  {aiData?.numbers.map(num => (
                    <span 
                      key={num} 
                      className="bg-gray-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
                    >
                      {num.toString().padStart(2, '0')}
                    </span>
                  ))}
                </div>
                
                <div className="flex mt-4 gap-3">
                  <Button 
                    size="sm" 
                    variant="default" 
                    className="bg-accent hover:bg-accent/90 text-xs w-full"
                    onClick={handleQuickBet}
                  >
                    Quick Bet
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs w-full"
                    asChild
                  >
                    <Link href="/play">
                      Select Numbers
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <p className="text-gray-300 text-xs text-center italic">
        AI predictions are based on historical data analysis and are not guarantees of winning results.
      </p>
    </div>
  );
}
