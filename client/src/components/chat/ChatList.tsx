import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Search, Users, UserPlus, Plus } from 'lucide-react';
import { chatService, type ChatUser, type ChatGroup } from '../../services/chat-service';
import { useToast } from '@/hooks/use-toast';

interface ChatListProps {
  currentUserId: number;
  onSelectUser: (user: ChatUser) => void;
  onSelectGroup: (group: ChatGroup) => void;
  onCreateGroup: () => void;
}

export function ChatList({ 
  currentUserId, 
  onSelectUser, 
  onSelectGroup, 
  onCreateGroup 
}: ChatListProps) {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch users and groups in parallel
        const [fetchedUsers, fetchedGroups] = await Promise.all([
          chatService.getAvailableUsers(),
          chatService.getGroups()
        ]);
        
        // Filter out current user from the users list
        const filteredUsers = fetchedUsers.filter(user => user.id !== currentUserId);
        
        setUsers(filteredUsers);
        setGroups(fetchedGroups);
      } catch (error) {
        console.error('Failed to fetch chat data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load chat contacts',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUserId, toast]);
  
  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Filter groups based on search term
  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <div className="border rounded-lg overflow-hidden h-[600px] max-h-[80vh] flex flex-col">
      <div className="border-b p-3">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Tabs defaultValue="direct" className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-2 px-4 py-2">
          <TabsTrigger value="direct" className="text-sm">
            <Users className="h-4 w-4 mr-2" />
            Direct Messages
          </TabsTrigger>
          <TabsTrigger value="groups" className="text-sm">
            <Users className="h-4 w-4 mr-2" />
            Group Chats
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="direct" className="flex-1 p-0">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-1">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'No users found' : 'No users available'}
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <Button
                    key={user.id}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => onSelectUser(user)}
                  >
                    <div className="flex items-center w-full">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src={`https://avatar.vercel.sh/${user.username}.png`} />
                        <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">{user.username}</span>
                        {user.isOnline && (
                          <span className="text-xs text-green-600">Online</span>
                        )}
                      </div>
                      <div className="ml-auto">
                        {/* You can add unread message count here */}
                      </div>
                    </div>
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="groups" className="flex-1 p-0 flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-1">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : filteredGroups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'No groups found' : 'No groups available'}
                </div>
              ) : (
                filteredGroups.map((group) => (
                  <Button
                    key={group.id}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => onSelectGroup(group)}
                  >
                    <div className="flex items-center w-full">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarFallback>{getInitials(group.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">{group.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {group.memberCount || 0} members
                        </span>
                      </div>
                      <div className="ml-auto">
                        {/* You can add unread message count here */}
                      </div>
                    </div>
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
          
          <div className="p-3 border-t">
            <Button 
              onClick={onCreateGroup} 
              className="w-full"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Group
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}