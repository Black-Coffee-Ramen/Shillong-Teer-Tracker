import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { ChevronLeft, Send, User, Bot, Mail, Phone, HelpCircle } from "lucide-react";

interface SupportChatProps {
  onBack: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

// Common FAQs for betting app
const faqs = [
  {
    question: "How do I place a bet?",
    answer: "To place a bet, go to the Play page, select your desired numbers, choose a round (1 or 2), enter your bet amount, and click 'Place Bet'."
  },
  {
    question: "When are the results announced?",
    answer: "Results for Round 1 are announced at approximately 15:30 IST, and Round 2 results are announced at 16:30 IST, every day except Sundays when the market is closed."
  },
  {
    question: "How do I deposit money?",
    answer: "To deposit money into your account, go to your Profile and select the 'Wallet' section. Click on 'Add Money' and follow the instructions to complete your deposit using one of our supported payment methods."
  },
  {
    question: "What is the minimum withdrawal amount?",
    answer: "The minimum amount for withdrawals is ₹500. Withdrawals below this amount are not processed."
  },
  {
    question: "How long does it take to process withdrawals?",
    answer: "Withdrawals are typically processed within 24-48 hours. The actual transfer to your bank account may take an additional 1-3 business days depending on your bank."
  },
  {
    question: "Is betting available on Sundays?",
    answer: "No, Shillong Teer does not operate on Sundays. The market is closed, and no betting or results are available on Sundays."
  },
  {
    question: "What happens if I win?",
    answer: "If your bet wins, your winnings will be automatically credited to your account balance. You'll receive a notification if you have enabled winning alerts in your settings."
  },
  {
    question: "How do I verify my account?",
    answer: "To verify your account, go to Account Settings and complete the KYC verification process by providing your valid ID proof and address proof."
  }
];

export default function SupportChat({ onBack }: SupportChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'chat' | 'faq'>('chat');
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: `Hi ${user?.name || 'there'}! 👋 I'm your Shillong Teer India support assistant. How can I help you today?`,
      timestamp: new Date()
    }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: newMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);
    
    // Simulate bot thinking and responding
    setTimeout(() => {
      const botResponse = generateBotResponse(newMessage);
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
  };
  
  const generateBotResponse = (message: string): string => {
    const lowerMsg = message.toLowerCase();
    
    // Check for deposit related questions
    if (lowerMsg.includes('deposit') || lowerMsg.includes('add money') || lowerMsg.includes('payment')) {
      return "You can deposit money by going to your wallet and clicking on 'Add Money'. We support various payment methods including UPI, credit/debit cards, and net banking. The minimum deposit amount is ₹100.";
    }
    
    // Check for withdrawal related questions
    if (lowerMsg.includes('withdraw') || lowerMsg.includes('cash out') || lowerMsg.includes('transfer money')) {
      return "To withdraw funds, go to your wallet and click on 'Withdraw'. The minimum withdrawal amount is ₹500, and processing usually takes 24-48 hours. Make sure your KYC verification is complete.";
    }
    
    // Check for betting related questions
    if (lowerMsg.includes('bet') || lowerMsg.includes('play') || lowerMsg.includes('number') || lowerMsg.includes('select')) {
      return "To place a bet, go to the Play page, select your numbers, choose Round 1 (15:30) or Round 2 (16:30), enter your bet amount, and submit. Bets can be placed until a few minutes before the round closes.";
    }
    
    // Check for result related questions
    if (lowerMsg.includes('result') || lowerMsg.includes('winner') || lowerMsg.includes('winning')) {
      return "Results for Round 1 are announced at approximately 15:30 IST, and Round 2 results at 16:30 IST. You can view them on the Results page or Home page. Winners receive notifications and the winnings are credited automatically.";
    }
    
    // Check for account related questions
    if (lowerMsg.includes('account') || lowerMsg.includes('profile') || lowerMsg.includes('login') || lowerMsg.includes('register')) {
      return "You can manage your account settings in the Profile section. This includes updating your personal information, changing your password, and managing notification preferences. For security reasons, some changes may require verification.";
    }
    
    // Check for contact related questions
    if (lowerMsg.includes('contact') || lowerMsg.includes('email') || lowerMsg.includes('phone') || lowerMsg.includes('human')) {
      return "You can contact our support team via email at support@shillongteerindia.com or call us at +91-9876543210 during business hours (10 AM - 6 PM IST, Monday to Saturday).";
    }
    
    // Default response for anything else
    return "I'm not sure I understand your question. Could you please rephrase or select from one of our frequently asked questions in the FAQ tab? Alternatively, you can contact our support team directly via email or phone.";
  };
  
  const handleRaiseTicket = () => {
    toast({
      title: "Support Ticket Created",
      description: "Our team will get back to you within 24 hours.",
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="mr-2"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-semibold text-white">Help & Support</h2>
      </div>
      
      <div className="bg-gray-800/50 rounded-lg mb-4">
        <div className="flex">
          <button 
            className={`flex-1 py-3 px-4 rounded-tl-lg ${activeTab === 'chat' ? 'bg-accent text-white' : 'text-gray-400'}`}
            onClick={() => setActiveTab('chat')}
          >
            <div className="flex items-center justify-center space-x-2">
              <Bot className="h-4 w-4" />
              <span>Support Chat</span>
            </div>
          </button>
          <button 
            className={`flex-1 py-3 px-4 rounded-tr-lg ${activeTab === 'faq' ? 'bg-accent text-white' : 'text-gray-400'}`}
            onClick={() => setActiveTab('faq')}
          >
            <div className="flex items-center justify-center space-x-2">
              <HelpCircle className="h-4 w-4" />
              <span>FAQs</span>
            </div>
          </button>
        </div>
      </div>
      
      {activeTab === 'chat' ? (
        <>
          <div className="flex-1 overflow-y-auto mb-4 space-y-4 bg-gray-800/30 rounded-lg p-4 max-h-[50vh]">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] p-3 rounded-lg ${
                  msg.sender === 'user' 
                    ? 'bg-accent text-white rounded-tr-none' 
                    : 'bg-gray-700 text-gray-100 rounded-tl-none'
                }`}>
                  <div className="flex items-center mb-1">
                    {msg.sender === 'bot' ? (
                      <Bot className="h-4 w-4 mr-2" />
                    ) : (
                      <User className="h-4 w-4 mr-2" />
                    )}
                    <span className="text-xs opacity-75">
                      {msg.sender === 'user' ? 'You' : 'Support Bot'} • {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <p>{msg.text}</p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-700 text-white p-3 rounded-lg rounded-tl-none max-w-[80%]">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          <div className="mt-auto">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex space-x-2"
            >
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message here..."
                className="flex-1"
              />
              <Button type="submit" disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
          
          <div className="mt-4 bg-gray-800/30 rounded-lg p-4">
            <h3 className="font-medium text-white mb-2">Contact Support Directly</h3>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-300">
                <Mail className="h-4 w-4 mr-2 text-accent" />
                <span>support@shillongteerindia.com</span>
              </div>
              <div className="flex items-center text-sm text-gray-300">
                <Phone className="h-4 w-4 mr-2 text-accent" />
                <span>+91-9876543210 (10 AM - 6 PM, Mon-Sat)</span>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-3"
              onClick={handleRaiseTicket}
            >
              Raise Support Ticket
            </Button>
          </div>
        </>
      ) : (
        // FAQ Section
        <div className="bg-gray-800/30 rounded-lg p-4 overflow-y-auto max-h-[70vh]">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent>
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          
          <div className="mt-6 pt-4 border-t border-gray-700">
            <h3 className="font-medium text-white mb-2">Can't find what you're looking for?</h3>
            <p className="text-sm text-gray-400 mb-4">
              Contact our support team directly or switch to the chat to ask specific questions.
            </p>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setActiveTab('chat')}
              >
                <Bot className="h-4 w-4 mr-2" />
                Chat with us
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleRaiseTicket}
              >
                Raise Ticket
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}