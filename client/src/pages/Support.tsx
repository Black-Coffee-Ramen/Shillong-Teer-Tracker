import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { HelpContent } from '../components/support/HelpContent';
import { SupportTicket } from '../components/support/SupportTicket';
import { Button } from '../components/ui/button';
import { HelpCircle, Ticket, MessageSquare } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Support() {
  const [activeTab, setActiveTab] = useState('help');
  const [, navigate] = useLocation();
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Help & Support</h1>
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="help">
            <HelpCircle className="h-4 w-4 mr-2" />
            Help Center
          </TabsTrigger>
          <TabsTrigger value="tickets">
            <Ticket className="h-4 w-4 mr-2" />
            Support Tickets
          </TabsTrigger>
          <TabsTrigger value="chat">
            <MessageSquare className="h-4 w-4 mr-2" />
            Live Chat
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="help" className="py-4">
          <HelpContent />
        </TabsContent>
        
        <TabsContent value="tickets" className="py-4">
          <SupportTicket />
        </TabsContent>
        
        <TabsContent value="chat" className="py-4">
          <div className="bg-white dark:bg-gray-950 rounded-lg border p-8 text-center">
            <h3 className="text-lg font-medium mb-2">Chat with Other Users</h3>
            <p className="text-muted-foreground mb-6">
              Need to discuss something with other bettors? Join our chat rooms or
              start private conversations.
            </p>
            <Button onClick={() => navigate('/chat')}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Go to Chat
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}