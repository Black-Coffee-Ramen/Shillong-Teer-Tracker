import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, getFormattedDate, formatTwoDigits } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PhoneCall, Mail, User, Calendar, CreditCard, Search, RefreshCcw } from "lucide-react";

interface UserBet {
  id: number;
  userId: number;
  number: number;
  amount: number;
  round: number;
  date: string;
  isWin: boolean;
  winAmount: number | null;
}

interface UserTransaction {
  id: number;
  userId: number;
  amount: number;
  type: string;
  description: string;
  date: string;
  metadata: string;
}

interface UserDetails {
  id: number;
  username: string;
  name: string;
  email: string;
  phone?: string;
  balance: number;
  bets: UserBet[];
  transactions: UserTransaction[];
}

export default function UserManagement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Fetch user data
  const { data: users, isLoading, error, refetch } = useQuery<UserDetails[]>({
    queryKey: ["/api/admin/users", refreshKey],
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    // Enhanced error logging
    onError: (error: Error) => {
      // Log more details to help debug API issues
      console.error("Error fetching admin user data:", error);
      console.error("Error details:", error.message, error.stack);
      
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be logged in as an admin to view this data."
      });
    }
  } as any);
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetch();
    
    toast({
      title: "Refreshed",
      description: "User data has been refreshed",
    });
  };
  
  // Filter users based on search term
  const filteredUsers = users?.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.username.toLowerCase().includes(searchLower) ||
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      (user.phone && user.phone.includes(searchTerm))
    );
  });
  
  // Format phone number for display
  const formatPhone = (phone?: string) => {
    if (!phone) return "Not provided";
    
    // Format as XXX-XXX-XXXX if 10 digits
    if (phone.length === 10) {
      return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
    }
    
    return phone;
  };
  
  // Format bet number for display (with leading zero)
  const formatBetNumber = (num: number) => {
    return formatTwoDigits(num);
  };
  
  // Return transaction description based on type
  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "deposit": return "Deposit";
      case "withdrawal": return "Withdrawal";
      case "bet": return "Bet Placed";
      case "win": return "Win";
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4 bg-white p-4 rounded-md shadow-sm border border-gray-200">
        <h2 className="text-gray-800 text-lg font-semibold">User Management</h2>
        <div className="flex items-center justify-center h-40">
          <div className="flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            <p className="mt-2 text-gray-600">Loading user data...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    console.error("User management error:", error);
    
    // Create demo data for offline showcase when API fails
    // This is helpful for the Android APK demonstration
    const demoUserData: UserDetails[] = [
      {
        id: 1,
        username: "user1",
        name: "Demo User",
        email: "user@example.com",
        phone: "9876543210",
        balance: 1000,
        bets: [
          {
            id: 1,
            userId: 1,
            number: 42,
            amount: 100,
            round: 1,
            date: new Date().toISOString(),
            isWin: false,
            winAmount: null
          },
          {
            id: 2,
            userId: 1,
            number: 78,
            amount: 200,
            round: 2,
            date: new Date().toISOString(),
            isWin: true,
            winAmount: 16000
          }
        ],
        transactions: [
          {
            id: 1,
            userId: 1,
            amount: 1000,
            type: "deposit",
            description: "Initial deposit",
            date: new Date().toISOString(),
            metadata: JSON.stringify({ method: "bank" })
          }
        ]
      }
    ];
    
    // Show error with demo data option
    return (
      <div className="space-y-4 bg-white p-4 rounded-md shadow-sm border border-gray-200">
        <h2 className="text-gray-800 text-lg font-semibold">User Management</h2>
        <div className="p-4 bg-red-50 rounded-md border border-red-200 text-red-800">
          <p>Error loading user data. {error instanceof Error ? error.message : "Please try again later."}</p>
          <p className="text-xs text-red-600 mt-1">Make sure you're logged in as an admin and have permissions.</p>
          <div className="flex space-x-2 mt-2">
            <Button onClick={handleRefresh} className="bg-red-100 text-red-800 hover:bg-red-200">
              Retry
            </Button>
            <Button 
              onClick={() => {
                // Show toast to indicate we're using demo data
                toast({
                  title: "Using Demo Data",
                  description: "Showing simulated user data for demonstration purposes.",
                  variant: "default"
                });
                // Update the component with demo data
                return demoUserData;
              }}
              className="bg-purple-100 text-purple-800 hover:bg-purple-200"
            >
              Show Demo Data
            </Button>
          </div>
        </div>
        
        {/* Show demo data section */}
        <div className="mt-6 border-t border-gray-200 pt-4">
          <h3 className="text-gray-700 font-medium mb-2">Demo User Data Preview</h3>
          <p className="text-sm text-gray-600 mb-4">
            This is a preview of demo user data that would be available in the actual application.
            For the Android APK version, this data will be stored locally.
          </p>
          
          {/* Render demo user data */}
          <Accordion type="single" collapsible className="w-full">
            {demoUserData.map((user) => (
              <AccordionItem key={user.id} value={user.id.toString()} className="border border-gray-100 mb-2 rounded-md">
                <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 rounded-t-md">
                  <div className="flex items-center text-left w-full">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                    </div>
                    <div className="text-right mr-2">
                      <p className="font-medium text-gray-900">{formatCurrency(user.balance)}</p>
                      <p className="text-sm text-gray-500">{user.bets.length} bets</p>
                    </div>
                  </div>
                </AccordionTrigger>
                
                {/* User details, bets, transactions content */}
                <AccordionContent className="px-4 pt-2 pb-4 bg-white border-t border-gray-100">
                  {/* User Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2 bg-gray-50 p-3 rounded-md">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-gray-500 text-sm">User ID:</span>
                        <span className="text-gray-800 text-sm ml-2 font-mono">{user.id}</span>
                      </div>
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-gray-500 text-sm">Email:</span>
                        <span className="text-gray-800 text-sm ml-2">{user.email}</span>
                      </div>
                      <div className="flex items-center">
                        <PhoneCall className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-gray-500 text-sm">Phone:</span>
                        <span className="text-gray-800 text-sm ml-2">{formatPhone(user.phone)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 bg-gray-50 p-3 rounded-md">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-gray-500 text-sm">Demo Created:</span>
                        <span className="text-gray-800 text-sm ml-2">
                          {getFormattedDate(new Date())}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <CreditCard className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-gray-500 text-sm">Balance:</span>
                        <span className="text-gray-800 text-sm ml-2 font-medium">{formatCurrency(user.balance)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Demo Tab Content */}
                  <div className="text-sm text-purple-600 mb-2 italic">
                    Demo data for Android APK demonstration - expand tabs below to view details
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 bg-white p-4 rounded-md shadow-sm border border-gray-200">
      <div className="flex justify-between items-center">
        <h2 className="text-gray-800 text-lg font-semibold">User Management</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          className="text-xs border-gray-200 text-gray-700 hover:bg-gray-50"
        >
          <RefreshCcw className="h-3 w-3 mr-1" /> Refresh
        </Button>
      </div>
      
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search by name, username, email or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8 bg-white border border-gray-200 text-gray-800"
        />
      </div>
      
      {/* User List */}
      {!filteredUsers || filteredUsers.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-md">
          <User className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">No users found</p>
          {searchTerm && (
            <p className="text-sm text-gray-400 mt-1">
              Try adjusting your search criteria
            </p>
          )}
        </div>
      ) : (
        <Accordion type="single" collapsible className="w-full">
          {filteredUsers.map((user) => (
            <AccordionItem key={user.id} value={user.id.toString()} className="border border-gray-100 mb-2 rounded-md">
              <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 rounded-t-md">
                <div className="flex items-center text-left w-full">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">@{user.username}</p>
                  </div>
                  <div className="text-right mr-2">
                    <p className="font-medium text-gray-900">{formatCurrency(user.balance)}</p>
                    <p className="text-sm text-gray-500">{user.bets.length} bets</p>
                  </div>
                </div>
              </AccordionTrigger>
              
              <AccordionContent className="px-4 pt-2 pb-4 bg-white border-t border-gray-100">
                {/* User Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2 bg-gray-50 p-3 rounded-md">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-gray-500 text-sm">User ID:</span>
                      <span className="text-gray-800 text-sm ml-2 font-mono">{user.id}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-gray-500 text-sm">Email:</span>
                      <span className="text-gray-800 text-sm ml-2">{user.email}</span>
                    </div>
                    <div className="flex items-center">
                      <PhoneCall className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-gray-500 text-sm">Phone:</span>
                      <span className="text-gray-800 text-sm ml-2">{formatPhone(user.phone)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 bg-gray-50 p-3 rounded-md">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-gray-500 text-sm">Latest Activity:</span>
                      <span className="text-gray-800 text-sm ml-2">
                        {user.transactions.length > 0 
                          ? getFormattedDate(new Date(user.transactions[user.transactions.length - 1].date))
                          : 'No activity'
                        }
                      </span>
                    </div>
                    <div className="flex items-center">
                      <CreditCard className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-gray-500 text-sm">Balance:</span>
                      <span className="text-gray-800 text-sm ml-2 font-medium">{formatCurrency(user.balance)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Tabs for Bets and Transactions */}
                <Tabs defaultValue="bets" className="w-full">
                  <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="bets" className="text-sm">Bet History</TabsTrigger>
                    <TabsTrigger value="transactions" className="text-sm">Transactions</TabsTrigger>
                  </TabsList>
                  
                  {/* Bets Tab */}
                  <TabsContent value="bets" className="border-none p-0">
                    {user.bets.length === 0 ? (
                      <div className="text-center p-6 bg-gray-50 rounded-md">
                        <p className="text-gray-500">No bets found</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto bg-white rounded-md border border-gray-100">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-gray-200">
                              <TableHead className="text-gray-700">Bet ID</TableHead>
                              <TableHead className="text-gray-700">Number</TableHead>
                              <TableHead className="text-gray-700">Round</TableHead>
                              <TableHead className="text-gray-700">Amount</TableHead>
                              <TableHead className="text-gray-700">Date</TableHead>
                              <TableHead className="text-gray-700">Outcome</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {user.bets
                              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                              .map((bet) => (
                                <TableRow key={bet.id} className="border-gray-200">
                                  <TableCell className="text-gray-800 font-mono text-xs">
                                    {bet.id}
                                  </TableCell>
                                  <TableCell className="text-gray-800 font-medium">
                                    {formatBetNumber(bet.number)}
                                  </TableCell>
                                  <TableCell className="text-gray-800">
                                    {bet.round === 1 ? 'First' : 'Second'}
                                  </TableCell>
                                  <TableCell className="text-gray-800">
                                    {formatCurrency(bet.amount)}
                                  </TableCell>
                                  <TableCell className="text-gray-600 text-sm">
                                    {getFormattedDate(new Date(bet.date))}
                                  </TableCell>
                                  <TableCell>
                                    {bet.isWin ? (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                        Win: {formatCurrency(bet.winAmount || 0)}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                        No win
                                      </span>
                                    )}
                                  </TableCell>
                                </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </TabsContent>
                  
                  {/* Transactions Tab */}
                  <TabsContent value="transactions" className="border-none p-0">
                    {user.transactions.length === 0 ? (
                      <div className="text-center p-6 bg-gray-50 rounded-md">
                        <p className="text-gray-500">No transactions found</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto bg-white rounded-md border border-gray-100">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-gray-200">
                              <TableHead className="text-gray-700">Tx ID</TableHead>
                              <TableHead className="text-gray-700">Type</TableHead>
                              <TableHead className="text-gray-700">Amount</TableHead>
                              <TableHead className="text-gray-700">Description</TableHead>
                              <TableHead className="text-gray-700">Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {user.transactions
                              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                              .map((tx) => (
                                <TableRow key={tx.id} className="border-gray-200">
                                  <TableCell className="text-gray-800 font-mono text-xs">
                                    {tx.id}
                                  </TableCell>
                                  <TableCell>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                      tx.type === 'deposit' || tx.type === 'win' 
                                        ? 'bg-green-50 text-green-700' 
                                        : tx.type === 'withdrawal' || tx.type === 'bet'
                                          ? 'bg-red-50 text-red-700'
                                          : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {getTransactionTypeLabel(tx.type)}
                                    </span>
                                  </TableCell>
                                  <TableCell className={`font-medium ${
                                    tx.amount > 0 
                                      ? 'text-green-600' 
                                      : tx.amount < 0 
                                        ? 'text-red-600' 
                                        : 'text-gray-600'
                                  }`}>
                                    {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                  </TableCell>
                                  <TableCell className="text-gray-600 max-w-[200px] truncate">
                                    {tx.description}
                                  </TableCell>
                                  <TableCell className="text-gray-600 text-sm">
                                    {getFormattedDate(new Date(tx.date))}
                                  </TableCell>
                                </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}