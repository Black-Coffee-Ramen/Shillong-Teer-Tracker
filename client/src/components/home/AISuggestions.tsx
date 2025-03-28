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
  
  // Simulate fetching AI suggestions with loading state
  const { data: aiData, isLoading } = useQuery({
    queryKey: ["/api/ai-suggestions", analysisType],
    queryFn: async () => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock data based on different analysis types
      // In a real implementation, this would come from the backend
      switch (analysisType) {
        case "frequency":
          return {
            numbers: [27, 43, 68, 92],
            confidence: 0.72,
            description: "These numbers have appeared most frequently in the last 30 days."
          };
        case "pattern":
          return {
            numbers: [15, 36, 54, 78],
            confidence: 0.68,
            description: "These numbers follow statistical patterns from recent results."
          };
        case "hot":
          return {
            numbers: [33, 47, 72, 88],
            confidence: 0.65,
            description: "These 'hot numbers' have had recent wins or near misses."
          };
        case "combinations":
          return {
            numbers: [19, 24, 61, 82],
            confidence: 0.71,
            description: "These number combinations are statistically favorable today."
          };
      }
    },
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
                
                <p className="text-gray-400 text-xs mt-2 mb-3">
                  {aiData?.description}
                </p>
                
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
      
      <p className="text-gray-500 text-xs text-center italic">
        AI predictions are based on historical data analysis and are not guarantees of winning results.
      </p>
    </div>
  );
}
