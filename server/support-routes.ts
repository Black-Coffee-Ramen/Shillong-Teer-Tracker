import { Router, Request, Response } from 'express';
import { storage } from './db-storage';

const router = Router();

// Mock data for support tickets
const mockTickets: any[] = [
  {
    id: 1,
    subject: 'Payment not processed',
    category: 'payment',
    description: 'I made a deposit but it hasn\'t been credited to my account yet.',
    priority: 'high',
    status: 'new',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
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
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
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
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
      },
      {
        id: 2,
        ticketId: 2,
        userId: 3,
        username: 'jane_smith',
        isAdmin: false,
        content: 'I was trying to bet on numbers 25, 38, 42 for today\'s first round.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString()
      }
    ]
  }
];

// Get all tickets (admin only)
router.get('/tickets', (req: Request, res: Response) => {
  // In a real app, we would check user is admin and fetch from database
  return res.json(mockTickets);
});

// Get tickets for a specific user
router.get('/tickets/user/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  
  // Filter tickets by user ID
  const userTickets = mockTickets.filter(ticket => ticket.userId === Number(userId));
  
  return res.json(userTickets);
});

// Get a specific ticket by ID
router.get('/tickets/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  
  const ticket = mockTickets.find(t => t.id === Number(id));
  
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  
  return res.json(ticket);
});

// Create a new ticket
router.post('/tickets', (req: Request, res: Response) => {
  const ticketData = req.body;
  
  // In a real app, get user from session
  const userId = 2; // Mock user ID
  const username = 'john_doe'; // Mock username
  
  const newTicket = {
    ...ticketData,
    id: Date.now(),
    status: 'new',
    createdAt: new Date().toISOString(),
    userId,
    username,
    responses: []
  };
  
  // In a real app, save to database
  mockTickets.push(newTicket);
  
  return res.status(201).json(newTicket);
});

// Update ticket status (admin only)
router.patch('/tickets/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const ticket = mockTickets.find(t => t.id === Number(id));
  
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  
  // Update status
  ticket.status = status;
  
  return res.json(ticket);
});

// Add response to ticket
router.post('/tickets/:id/responses', (req: Request, res: Response) => {
  const { id } = req.params;
  const { content, isAdmin = false } = req.body;
  
  const ticket = mockTickets.find(t => t.id === Number(id));
  
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  
  // In a real app, get user from session
  const userId = isAdmin ? 1 : ticket.userId;
  const username = isAdmin ? 'admin' : ticket.username;
  
  const newResponse = {
    id: Date.now(),
    ticketId: Number(id),
    userId,
    username,
    isAdmin,
    content,
    createdAt: new Date().toISOString()
  };
  
  // Add response to ticket
  ticket.responses.push(newResponse);
  
  // If it's an admin response and ticket is new, change status to in-progress
  if (isAdmin && ticket.status === 'new') {
    ticket.status = 'in-progress';
  }
  
  return res.status(201).json(newResponse);
});

export default router;