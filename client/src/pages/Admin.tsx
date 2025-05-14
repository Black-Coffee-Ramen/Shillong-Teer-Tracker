import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { TicketManagement } from '../components/admin/TicketManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Shield, Users, Activity, Settings, AlertTriangle } from 'lucide-react';

// Mock current user - in a real app, this would come from authentication context
const currentUser = {
  id: 1,
  username: 'Demo User',
  isAdmin: true, // Set to true for demo purposes
};

export default function Admin() {
  const [isAdmin, setIsAdmin] = useState(currentUser.isAdmin);
  const { toast } = useToast();
  
  // In a real app, this would check user permissions from the server
  if (!isAdmin) {
    return (
      <div className="container mx-auto py-12">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to access the admin dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Logged in as <strong>{currentUser.username}</strong>
          </span>
        </div>
      </div>
      
      <Tabs defaultValue="support" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="support">
            <Shield className="h-4 w-4 mr-2" />
            Support Tickets
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="h-4 w-4 mr-2" />
            Activity Logs
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="support" className="py-4">
          <TicketManagement />
        </TabsContent>
        
        <TabsContent value="users" className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                View and manage user accounts and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="py-6">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  This section is under development.
                </p>
                <Button
                  onClick={() => {
                    toast({
                      title: 'Coming Soon',
                      description: 'User management features will be available in a future update.',
                    });
                  }}
                >
                  View Users
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity" className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Logs</CardTitle>
              <CardDescription>
                Monitor system activities and user actions
              </CardDescription>
            </CardHeader>
            <CardContent className="py-6">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  This section is under development.
                </p>
                <Button
                  onClick={() => {
                    toast({
                      title: 'Coming Soon',
                      description: 'Activity tracking features will be available in a future update.',
                    });
                  }}
                >
                  View Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Configure application settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="py-6">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  This section is under development.
                </p>
                <Button
                  onClick={() => {
                    toast({
                      title: 'Coming Soon',
                      description: 'Settings configuration will be available in a future update.',
                    });
                  }}
                >
                  Manage Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}