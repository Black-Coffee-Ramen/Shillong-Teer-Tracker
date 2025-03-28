import React, { useState } from 'react';
import { Loader2, ExternalLink, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

export default function LiveStream() {
  const [isLoading, setIsLoading] = useState(true);
  const channelUrl = "https://www.youtube.com/@Shillongteerlive129/streams";
  
  // YouTube embed URL for the latest livestream from the channel
  const embedUrl = "https://www.youtube.com/embed/live_stream?channel=UCa9p2o55q6PQQMy7TfG2DRg";
  
  return (
    <div className="bg-secondary rounded-xl p-4 mb-6 shadow-md">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-white font-semibold text-lg">Live Stream</h2>
        <div className="flex items-center gap-2">
          <span className="bg-red-500 bg-opacity-20 text-red-400 text-xs px-2 py-1 rounded-full flex items-center">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></span>
            LIVE
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 text-xs" 
            onClick={() => window.open(channelUrl, '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Channel
          </Button>
        </div>
      </div>
      
      <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video mb-2">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-10 w-10 text-accent animate-spin" />
          </div>
        )}
        
        <iframe
          src={embedUrl}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Shillong Teer Live Stream"
          onLoad={() => setIsLoading(false)}
        ></iframe>
      </div>
      
      <div className="flex justify-end">
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
            >
              <Maximize className="h-3 w-3 mr-1" />
              Fullscreen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[90vw] p-0 bg-black border-0">
            <div className="aspect-video w-full">
              <iframe
                src={embedUrl}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Shillong Teer Live Stream Fullscreen"
              ></iframe>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <p className="text-gray-500 text-xs text-center italic mt-3">
        Official Shillong Teer live stream showing results and draws.
      </p>
    </div>
  );
}