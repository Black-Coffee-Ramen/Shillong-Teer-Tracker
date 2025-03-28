import { useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import CountdownTimer from "@/components/home/CountdownTimer";
import ResultsPreview from "@/components/home/ResultsPreview";
import GameInfo from "@/components/home/GameInfo";
import AISuggestions from "@/components/home/AISuggestions";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const { user } = useAuth();
  
  return (
    <div className="container mx-auto px-4 py-4">
      {/* Live Game Section */}
      <div className="bg-secondary rounded-xl p-4 mb-6 shadow-md">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-white font-poppins font-semibold">Live Draw</h2>
          <div className="flex items-center">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse mr-1"></span>
            <span className="text-sm text-red-500">LIVE</span>
          </div>
        </div>
        <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center mb-2 overflow-hidden">
          {/* Placeholder for live video embed - in a real app this would be a YouTube or Facebook iframe */}
          <div className="text-center">
            <i className="ri-live-line text-4xl text-gray-500 mb-2"></i>
            <p className="text-gray-500 text-sm">Live stream will appear here</p>
            <p className="text-xs text-gray-600 mt-1">YouTube/Facebook embed</p>
          </div>
        </div>
        
        {/* Today's Results Preview */}
        <ResultsPreview />
      </div>
      
      {/* Upcoming Draws & Countdown */}
      <div className="bg-secondary rounded-xl p-4 mb-6 shadow-md">
        <h2 className="text-white font-poppins font-semibold mb-3">Upcoming Draws</h2>
        
        <div className="grid grid-cols-1 gap-4">
          {/* Round 1 */}
          <CountdownTimer targetHour={15} targetMinute={30} label="15:30 IST" roundNumber={1} />
          
          {/* Round 2 */}
          <CountdownTimer targetHour={16} targetMinute={30} label="16:30 IST" roundNumber={2} />
        </div>
        
        <Link href="/play">
          <Button className="w-full bg-accent hover:bg-accent/90 text-white py-3 rounded-lg mt-4 font-poppins font-semibold flex items-center justify-center">
            <i className="ri-gamepad-line mr-2"></i> Play Now
          </Button>
        </Link>
      </div>
      
      {/* Game Rules */}
      <GameInfo />
      
      {/* AI Suggestions */}
      <AISuggestions />
      
      {/* Login/Register Section (shown only when not logged in) */}
      {!user && (
        <div className="bg-secondary rounded-xl p-4 mb-6 shadow-md">
          <h2 className="text-white font-poppins font-semibold mb-3 text-center">Account Access</h2>
          
          <p className="text-gray-400 text-sm text-center mb-4">Sign in to manage your wallet and track your betting history</p>
          
          <div className="grid grid-cols-2 gap-3">
            <Link href="/auth">
              <Button variant="outline" className="w-full border-accent text-accent hover:text-accent hover:bg-secondary/80">
                Sign In
              </Button>
            </Link>
            <Link href="/auth">
              <Button className="w-full bg-accent hover:bg-accent/90 text-white">
                Register
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
