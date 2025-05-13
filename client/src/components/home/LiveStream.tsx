import React from 'react';
import { Youtube, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LiveStream() {
  const channelUrl = "https://www.youtube.com/@Shillongteerlive129/streams";
  
  return (
    <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-gray-800 font-semibold text-lg">Live Results</h2>
        <div className="flex items-center gap-2">
          <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full flex items-center">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></span>
            LIVE
          </span>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-5 flex flex-col items-center justify-center text-center border border-gray-200">
        <Youtube className="h-12 w-12 text-red-500 mb-3" />
        <h3 className="text-gray-800 font-medium mb-2">Watch Live Results on YouTube</h3>
        <p className="text-gray-600 text-sm mb-4">
          View live draws and result announcements on the official Shillong Teer YouTube channel
        </p>
        
        <Button 
          size="lg" 
          className="bg-red-600 hover:bg-red-700 text-white w-full max-w-md gap-2"
          onClick={() => window.open(channelUrl, '_blank')}
        >
          <Youtube className="h-5 w-5" />
          Open YouTube Channel
          <ExternalLink className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      <p className="text-gray-500 text-xs text-center italic mt-3">
        The official Shillong Teer YouTube channel broadcasts live drawings and results daily.
      </p>
    </div>
  );
}