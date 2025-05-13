import { useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import CountdownTimer from "@/components/home/CountdownTimer";
import ResultsPreview from "@/components/home/ResultsPreview";
import GameInfo from "@/components/home/GameInfo";
import AISuggestions from "@/components/home/AISuggestions";
import LiveStream from "@/components/home/LiveStream";
import { Button } from "@/components/ui/button";
import { Play, Timer, Trophy, Info, BrainCircuit, LogIn, UserPlus } from "lucide-react";
import { Logo } from "@/components/common/Logo";

export default function HomePage() {
  const { user } = useAuth();
  
  return (
    <div className="py-4">
      {/* Main Betting Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-gray-900">Shillong Teer</h1>
          <div className="flex items-center gap-2">
            <select className="text-sm border border-gray-200 rounded px-2 py-1 text-gray-700 bg-white">
              <option>Today's Draws</option>
              <option>Tomorrow's Draws</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Today's Results Preview */}
      <div className="card-modern p-5 mb-6">
        <h2 className="section-title flex items-center">
          <Trophy className="mr-2 h-4 w-4 text-primary" />
          Today's Results
        </h2>
        <ResultsPreview />
      </div>
      
      {/* Upcoming Draws & Countdown */}
      <div className="card-modern p-5 mb-6">
        <h2 className="section-title flex items-center">
          <Timer className="mr-2 h-4 w-4 text-primary" />
          Upcoming Draws
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {/* Round 1 */}
          <div className="card-modern border-2 border-gray-100 p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <div className="bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center mr-2">
                  <span className="text-gray-700 font-bold">1</span>
                </div>
                <span className="font-medium text-gray-900">Round 1</span>
              </div>
              <span className="text-sm text-gray-500">15:30 IST</span>
            </div>
            <CountdownTimer targetHour={15} targetMinute={30} label="15:30 IST" roundNumber={1} />
          </div>
          
          {/* Round 2 */}
          <div className="card-modern border-2 border-gray-100 p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <div className="bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center mr-2">
                  <span className="text-gray-700 font-bold">2</span>
                </div>
                <span className="font-medium text-gray-900">Round 2</span>
              </div>
              <span className="text-sm text-gray-500">16:30 IST</span>
            </div>
            <CountdownTimer targetHour={16} targetMinute={30} label="16:30 IST" roundNumber={2} />
          </div>
        </div>
        
        <Link href="/play">
          <Button className="w-full bg-primary text-white hover:bg-primary/90 py-3 rounded-md font-medium flex items-center justify-center h-12">
            <Play className="mr-2 h-5 w-5" /> Place Bet
          </Button>
        </Link>
      </div>
      
      {/* Betting Options Grid */}
      <div className="card-modern p-5 mb-6">
        <h2 className="section-title flex items-center">
          <Play className="mr-2 h-4 w-4 text-primary" />
          Popular Betting Options
        </h2>
        
        <div className="space-y-3">
          <div className="betting-odds">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-gray-700 font-medium">1</span>
              </div>
              <div>
                <div className="text-gray-900 font-medium">Round 1 Direct</div>
                <div className="text-xs text-gray-500">Bet on exact number</div>
              </div>
            </div>
            <div className="betting-odd-value">80x</div>
          </div>
          
          <div className="betting-odds">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-gray-700 font-medium">2</span>
              </div>
              <div>
                <div className="text-gray-900 font-medium">Round 2 Direct</div>
                <div className="text-xs text-gray-500">Bet on exact number</div>
              </div>
            </div>
            <div className="betting-odd-value">80x</div>
          </div>
          
          <div className="betting-odds">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-gray-700 font-medium">C</span>
              </div>
              <div>
                <div className="text-gray-900 font-medium">Common Number</div>
                <div className="text-xs text-gray-500">Bet on both rounds</div>
              </div>
            </div>
            <div className="betting-odd-value">160x</div>
          </div>
        </div>
      </div>
      
      {/* AI Analysis */}
      <div className="card-modern p-5 mb-6">
        <h2 className="section-title flex items-center">
          <BrainCircuit className="mr-2 h-4 w-4 text-primary" />
          AI Predictions
        </h2>
        <AISuggestions />
      </div>
      
      {/* Game Info */}
      <div className="card-modern p-5 mb-6">
        <h2 className="section-title flex items-center">
          <Info className="mr-2 h-4 w-4 text-primary" />
          Game Information
        </h2>
        <GameInfo />
      </div>
      
      {/* Login/Register Section (shown only when not logged in) */}
      {!user && (
        <div className="card-modern p-5 mb-6 border-2 border-primary/10">
          <h2 className="section-title text-center mb-4">Join Now</h2>
          
          <p className="text-gray-600 text-sm text-center mb-6">Create an account to manage your wallet and track your betting history</p>
          
          <div className="grid grid-cols-2 gap-4">
            <Link href="/auth">
              <Button variant="outline" className="w-full btn-outline flex items-center justify-center h-11">
                <LogIn className="mr-2 h-4 w-4" /> Sign In
              </Button>
            </Link>
            <Link href="/auth">
              <Button className="w-full bg-primary text-white hover:bg-primary/90 flex items-center justify-center h-11">
                <UserPlus className="mr-2 h-4 w-4" /> Register
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
