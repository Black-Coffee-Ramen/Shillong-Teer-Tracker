import React, { useState } from 'react';
import { ChatList } from '../components/chat/ChatList';
import { ChatWindow } from '../components/chat/ChatWindow';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { chatService, type ChatUser, type ChatGroup } from '../services/chat-service';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// Form schema for creating a group
const groupSchema = z.object({
  name: z.string().min(3, {
    message: "Group name must be at least 3 characters.",
  }),
  description: z.string().optional(),
});

type GroupFormValues = z.infer<typeof groupSchema>;

// Mock current user - in a real app, this would come from authentication context
const currentUser = {
  id: 1,
  username: 'Demo User'
};

export default function Chat() {
  const [selectedChat, setSelectedChat] = useState<{
    type: 'user' | 'group';
    data: ChatUser | ChatGroup;
  } | null>(null);
  
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });
  
  const handleSelectUser = (user: ChatUser) => {
    setSelectedChat({
      type: 'user',
      data: user
    });
  };
  
  const handleSelectGroup = (group: ChatGroup) => {
    setSelectedChat({
      type: 'group',
      data: group
    });
  };
  
  const handleBack = () => {
    setSelectedChat(null);
  };
  
  const onCreateGroup = () => {
    setCreateGroupOpen(true);
  };
  
  const handleCreateGroup = async (data: GroupFormValues) => {
    try {
      setCreatingGroup(true);
      
      const newGroup = await chatService.createGroup({
        name: data.name,
        description: data.description,
      });
      
      // Join the new group automatically
      await chatService.joinGroup(newGroup.id!, currentUser.id);
      
      toast({
        title: 'Success',
        description: `Group "${data.name}" created successfully!`,
      });
      
      // Close dialog and reset form
      setCreateGroupOpen(false);
      form.reset();
      
      // Select the newly created group
      handleSelectGroup(newGroup);
    } catch (error) {
      console.error('Failed to create group:', error);
      toast({
        title: 'Error',
        description: 'Failed to create group. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCreatingGroup(false);
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Chat</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <ChatList
            currentUserId={currentUser.id}
            onSelectUser={handleSelectUser}
            onSelectGroup={handleSelectGroup}
            onCreateGroup={onCreateGroup}
          />
        </div>
        
        <div className="md:col-span-2">
          {selectedChat ? (
            <ChatWindow
              currentUserId={currentUser.id}
              recipientId={selectedChat.type === 'user' ? (selectedChat.data as ChatUser).id : undefined}
              groupId={selectedChat.type === 'group' ? (selectedChat.data as ChatGroup).id : undefined}
              chatName={selectedChat.type === 'user' 
                ? (selectedChat.data as ChatUser).username 
                : (selectedChat.data as ChatGroup).name}
              onBack={handleBack}
            />
          ) : (
            <div className="border rounded-lg flex items-center justify-center h-[600px] max-h-[80vh] text-center p-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Welcome to Chat</h3>
                <p className="text-muted-foreground mb-4">
                  Select a contact or group to start chatting
                </p>
                <Button onClick={onCreateGroup}>Create a New Group</Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Create Group Dialog */}
      <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>
              Create a new chat group and invite members to join.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateGroup)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter group name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter group description"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Briefly describe the purpose of this group.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateGroupOpen(false)}
                  disabled={creatingGroup}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={creatingGroup}>
                  {creatingGroup ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Group'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}