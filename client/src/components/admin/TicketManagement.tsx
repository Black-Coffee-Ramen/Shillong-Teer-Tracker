import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, Clock, AlertTriangle, AlertCircle, XCircle } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

// Support ticket type
interface SupportTicket {
  id: number;
  subject: string;
  category: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'in-progress' | 'resolved' | 'closed';
  createdAt: string;
  userId: number;
  username: string;
  responses?: TicketResponse[];
}

interface TicketResponse {
  id: number;
  ticketId: number;
  userId: number;
  username: string;
  isAdmin: boolean;
  content: string;
  createdAt: string;
}

// Mock data - this would come from the API in a real app
const mockTickets: SupportTicket[] = [
  {
    id: 1,
    subject: 'Payment not processed',
    category: 'payment',
    description: 'I made a deposit but it hasn\'t been credited to my account yet.',
    priority: 'high',
    status: 'new',
    createdAt: '2025-05-13T10:30:00Z',
    userId: 2,
    username: 'john_doe',
    responses: []
  },
  {
    id: 2,
    subject: 'Unable to place bet',
    category: 'betting',
    description: 'When I try to place a bet, I get an error message saying "Invalid selection".',
    priority: 'medium',
    status: 'in-progress',
    createdAt: '2025-05-12T14:45:00Z',
    userId: 3,
    username: 'jane_smith',
    responses: [
      {
        id: 1,
        ticketId: 2,
        userId: 1,
        username: 'admin',
        isAdmin: true,
        content: 'Could you please provide which numbers you were trying to bet on and for which round?',
        createdAt: '2025-05-12T15:30:00Z'
      },
      {
        id: 2,
        ticketId: 2,
        userId: 3,
        username: 'jane_smith',
        isAdmin: false,
        content: 'I was trying to bet on numbers 25, 38, 42 for today\'s first round.',
        createdAt: '2025-05-12T16:15:00Z'
      }
    ]
  }
];

export function TicketManagement() {
  const [tickets, setTickets] = useState<SupportTicket[]>(mockTickets);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [viewTicketOpen, setViewTicketOpen] = useState(false);
  const [responseContent, setResponseContent] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const { toast } = useToast();
  
  const filteredTickets = (status: string) => {
    if (status === 'all') {
      return tickets;
    }
    return tickets.filter(ticket => ticket.status === status);
  };
  
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'high':
        return <Badge variant="default">High</Badge>;
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-blue-500">New</Badge>;
      case 'in-progress':
        return <Badge className="bg-yellow-500">In Progress</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500">Resolved</Badge>;
      case 'closed':
        return <Badge variant="outline">Closed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'closed':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };
  
  const handleViewTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setViewTicketOpen(true);
  };
  
  const updateTicketStatus = (ticketId: number, newStatus: SupportTicket['status']) => {
    // In a real app, this would make an API call
    const updatedTickets = tickets.map(ticket => 
      ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
    );
    setTickets(updatedTickets);
    
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, status: newStatus });
    }
    
    toast({
      title: 'Status Updated',
      description: `Ticket status updated to ${newStatus}`,
    });
  };
  
  const handleSubmitResponse = async () => {
    if (!selectedTicket || !responseContent.trim()) return;
    
    setSubmittingResponse(true);
    
    try {
      // In a real app, this would make an API call
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create new response
      const newResponse: TicketResponse = {
        id: Date.now(), // This would be set by the server in a real app
        ticketId: selectedTicket.id,
        userId: 1, // Admin user ID
        username: 'admin',
        isAdmin: true,
        content: responseContent,
        createdAt: new Date().toISOString()
      };
      
      // Update ticket status to in-progress if it's new
      let newStatus = selectedTicket.status;
      if (newStatus === 'new') {
        newStatus = 'in-progress';
      }
      
      // Update tickets state
      const updatedTickets = tickets.map(ticket => {
        if (ticket.id === selectedTicket.id) {
          const updatedTicket = { 
            ...ticket, 
            status: newStatus,
            responses: [...(ticket.responses || []), newResponse]
          };
          return updatedTicket;
        }
        return ticket;
      });
      
      setTickets(updatedTickets);
      
      // Update selected ticket
      setSelectedTicket({
        ...selectedTicket,
        status: newStatus,
        responses: [...(selectedTicket.responses || []), newResponse]
      });
      
      setResponseContent('');
      
      toast({
        title: 'Response Sent',
        description: 'Your response has been sent to the user',
      });
    } catch (error) {
      console.error('Error sending response:', error);
      toast({
        title: 'Error',
        description: 'Failed to send response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmittingResponse(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="bg-gray-900 text-white rounded-t-lg">
        <CardTitle>Admin Ticket Management</CardTitle>
        <CardDescription className="text-gray-300">
          Manage user support tickets and respond to customer issues
        </CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="all">
            All Tickets
          </TabsTrigger>
          <TabsTrigger value="new">
            New
          </TabsTrigger>
          <TabsTrigger value="in-progress">
            In Progress
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved
          </TabsTrigger>
        </TabsList>
        
        {['all', 'new', 'in-progress', 'resolved'].map(status => (
          <TabsContent key={status} value={status} className="p-0">
            <CardContent className="p-4">
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets(status).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          No tickets found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTickets(status).map(ticket => (
                        <TableRow key={ticket.id}>
                          <TableCell>{ticket.id}</TableCell>
                          <TableCell className="font-medium">{ticket.subject}</TableCell>
                          <TableCell>{ticket.username}</TableCell>
                          <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                          <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                          <TableCell>{formatDate(ticket.createdAt)}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewTicket(ticket)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </TabsContent>
        ))}
      </Tabs>
      
      {/* Ticket Detail Dialog */}
      <Dialog open={viewTicketOpen} onOpenChange={setViewTicketOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Ticket #{selectedTicket?.id}: {selectedTicket?.subject}</DialogTitle>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Category:</p>
                  <p className="font-medium capitalize">{selectedTicket.category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Priority:</p>
                  <div className="mt-1">{getPriorityBadge(selectedTicket.priority)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status:</p>
                  <div className="flex items-center gap-1 mt-1">
                    {getStatusIcon(selectedTicket.status)}
                    <span className="capitalize">{selectedTicket.status.replace('-', ' ')}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">User:</p>
                  <p className="font-medium">{selectedTicket.username} (ID: {selectedTicket.userId})</p>
                </div>
              </div>
              
              <div className="border rounded-md p-3 mb-4 bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">Description:</p>
                <p>{selectedTicket.description}</p>
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Conversation History</h4>
                <ScrollArea className="h-[200px] border rounded-md p-3">
                  {selectedTicket.responses && selectedTicket.responses.length > 0 ? (
                    <div className="space-y-4">
                      {selectedTicket.responses.map(response => (
                        <div key={response.id} className="border-b pb-3 last:border-0">
                          <div className="flex justify-between mb-1">
                            <span className={`font-medium ${response.isAdmin ? 'text-primary' : ''}`}>
                              {response.isAdmin ? 'Admin' : response.username}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(response.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm">{response.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No responses yet</p>
                  )}
                </ScrollArea>
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Admin Response</h4>
                <Textarea
                  value={responseContent}
                  onChange={(e) => setResponseContent(e.target.value)}
                  placeholder="Type your response here..."
                  className="min-h-[100px]"
                  disabled={selectedTicket.status === 'closed'}
                />
              </div>
              
              <div className="flex justify-between">
                <div className="space-x-2">
                  {selectedTicket.status !== 'resolved' && (
                    <Button
                      variant="outline"
                      onClick={() => updateTicketStatus(selectedTicket.id, 'resolved')}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Resolved
                    </Button>
                  )}
                  {selectedTicket.status !== 'closed' && (
                    <Button
                      variant="outline"
                      onClick={() => updateTicketStatus(selectedTicket.id, 'closed')}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Close Ticket
                    </Button>
                  )}
                </div>
                
                <Button
                  onClick={handleSubmitResponse}
                  disabled={!responseContent.trim() || submittingResponse || selectedTicket.status === 'closed'}
                >
                  {submittingResponse ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Response'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}