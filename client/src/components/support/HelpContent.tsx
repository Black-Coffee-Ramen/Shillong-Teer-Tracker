import React, { useState } from 'react';
import { aiService } from '../../services/ai-service';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// Common topics for quick access
const HELP_TOPICS = [
  'How to place a bet',
  'Understanding odds',
  'Account balance',
  'Results calculation',
  'Withdrawal process',
  'Betting rules'
];

export function HelpContent() {
  const [topic, setTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [helpContent, setHelpContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchHelpContent = async (selectedTopic: string) => {
    if (!selectedTopic) return;
    
    setLoading(true);
    setTopic(selectedTopic);
    
    try {
      const response = await aiService.getHelpContent(selectedTopic);
      setHelpContent(response.message || response.content || 'No help content available.');
    } catch (error) {
      console.error('Failed to fetch help content:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch help content. Please try again later.',
        variant: 'destructive'
      });
      setHelpContent('Sorry, we couldn\'t load help content at this time. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleTopicSelection = (selectedTopic: string) => {
    setTopic(selectedTopic);
    fetchHelpContent(selectedTopic);
  };

  const handleCustomTopicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTopic) return;
    
    fetchHelpContent(customTopic);
    setCustomTopic('');
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-gray-900 text-white rounded-t-lg">
        <CardTitle>Help & Support</CardTitle>
        <CardDescription className="text-gray-300">
          Get help with any aspect of Shillong Teer betting
        </CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="topics" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="topics">Common Topics</TabsTrigger>
          <TabsTrigger value="search">Ask a Question</TabsTrigger>
        </TabsList>
        
        <TabsContent value="topics">
          <CardContent className="grid gap-4 pt-6">
            <div className="grid grid-cols-2 gap-2">
              {HELP_TOPICS.map((helpTopic) => (
                <Button 
                  key={helpTopic}
                  variant="outline" 
                  onClick={() => handleTopicSelection(helpTopic)}
                  className={topic === helpTopic ? 'border-primary' : ''}
                >
                  {helpTopic}
                </Button>
              ))}
            </div>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="search">
          <CardContent className="pt-6">
            <form onSubmit={handleCustomTopicSubmit} className="flex gap-2">
              <Input
                placeholder="Ask any question about Shillong Teer..."
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={!customTopic || loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ask'}
              </Button>
            </form>
          </CardContent>
        </TabsContent>
      </Tabs>
      
      {(loading || helpContent) && (
        <>
          <Separator />
          <CardContent className="pt-4">
            <div className="bg-gray-900 rounded-lg p-4 text-white">
              <h3 className="font-semibold mb-2">{topic}</h3>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ScrollArea className="h-[300px] max-h-[50vh] rounded-md">
                  <div className="p-2 text-gray-200">
                    {/* Using dangerouslySetInnerHTML to render markdown from AI */}
                    <div dangerouslySetInnerHTML={{ __html: helpContent || '' }} />
                  </div>
                </ScrollArea>
              )}
            </div>
          </CardContent>
        </>
      )}
      
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          Can't find what you're looking for? Raise a support ticket.
        </p>
      </CardFooter>
    </Card>
  );
}