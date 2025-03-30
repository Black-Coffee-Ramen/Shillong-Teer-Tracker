import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChevronLeft, User, Bell, Lock, Loader2 } from "lucide-react";

interface AccountSettingsProps {
  onBack: () => void;
}

export default function AccountSettings({ onBack }: AccountSettingsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    resultAlerts: true,
    winningAlerts: true,
    promotionalMessages: false,
    appUpdates: true,
  });
  
  // Profile settings
  const [profileSettings, setProfileSettings] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "", // Phone is not in the user object yet, but we'll add it for future use
  });
  
  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    enableBiometric: false,
    enableTwoFactor: false,
    loginAlerts: true,
  });
  
  // Change password fields
  const [passwordFields, setPasswordFields] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const handleSaveProfile = () => {
    setIsUpdating(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsUpdating(false);
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
      });
    }, 1000);
  };

  const handleSaveNotifications = () => {
    setIsUpdating(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsUpdating(false);
      toast({
        title: "Notification Settings Updated",
        description: "Your notification preferences have been saved.",
      });
    }, 1000);
  };

  const handleSaveSecurity = () => {
    setIsUpdating(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsUpdating(false);
      toast({
        title: "Security Settings Updated",
        description: "Your security preferences have been saved.",
      });
    }, 1000);
  };

  const handleChangePassword = () => {
    if (passwordFields.newPassword !== passwordFields.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation must match.",
        variant: "destructive",
      });
      return;
    }
    
    setIsUpdating(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsUpdating(false);
      setPasswordFields({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });
    }, 1000);
  };
  
  const handleDeleteAccount = () => {
    setIsUpdating(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsUpdating(false);
      setIsDeleteDialogOpen(false);
      toast({
        title: "Account Deleted",
        description: "Your account has been deleted. You will be logged out shortly.",
        variant: "destructive",
      });
      
      // Simulate logout redirect
      setTimeout(() => {
        window.location.href = "/auth";
      }, 2000);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="mr-2"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-semibold text-white">Account Settings</h2>
      </div>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="profile" className="data-[state=active]:bg-accent">
            <User className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-accent">
            <Bell className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-accent">
            <Lock className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profileSettings.name}
                onChange={(e) => setProfileSettings({...profileSettings, name: e.target.value})}
                placeholder="Your full name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profileSettings.email}
                onChange={(e) => setProfileSettings({...profileSettings, email: e.target.value})}
                placeholder="youremail@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex">
                <div className="inline-flex h-10 items-center justify-center rounded-l-md border border-r-0 border-input bg-background px-3 text-sm text-muted-foreground">
                  +91
                </div>
                <Input
                  id="phone"
                  type="tel"
                  value={profileSettings.phone}
                  onChange={(e) => setProfileSettings({...profileSettings, phone: e.target.value})}
                  placeholder="Your phone number"
                  className="rounded-l-none"
                />
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handleSaveProfile} 
            disabled={isUpdating}
            className="w-full"
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Profile Changes"
            )}
          </Button>
        </TabsContent>
        
        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="result-alerts" className="text-base">Result Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications when round results are announced
                </p>
              </div>
              <Switch
                id="result-alerts"
                checked={notificationSettings.resultAlerts}
                onCheckedChange={(checked) => 
                  setNotificationSettings({...notificationSettings, resultAlerts: checked})
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="winning-alerts" className="text-base">Winning Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications when you win a bet
                </p>
              </div>
              <Switch
                id="winning-alerts"
                checked={notificationSettings.winningAlerts}
                onCheckedChange={(checked) => 
                  setNotificationSettings({...notificationSettings, winningAlerts: checked})
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="promotional-messages" className="text-base">Promotional Messages</Label>
                <p className="text-sm text-muted-foreground">
                  Receive offers and promotional messages
                </p>
              </div>
              <Switch
                id="promotional-messages"
                checked={notificationSettings.promotionalMessages}
                onCheckedChange={(checked) => 
                  setNotificationSettings({...notificationSettings, promotionalMessages: checked})
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="app-updates" className="text-base">App Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications about app updates and new features
                </p>
              </div>
              <Switch
                id="app-updates"
                checked={notificationSettings.appUpdates}
                onCheckedChange={(checked) => 
                  setNotificationSettings({...notificationSettings, appUpdates: checked})
                }
              />
            </div>
          </div>
          
          <Button 
            onClick={handleSaveNotifications} 
            disabled={isUpdating}
            className="w-full"
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Notification Settings"
            )}
          </Button>
        </TabsContent>
        
        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-4">
              <h3 className="font-medium text-white">Security Options</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="biometric" className="text-base">Biometric Login</Label>
                  <p className="text-sm text-muted-foreground">
                    Use fingerprint or face recognition to login
                  </p>
                </div>
                <Switch
                  id="biometric"
                  checked={securitySettings.enableBiometric}
                  onCheckedChange={(checked) => 
                    setSecuritySettings({...securitySettings, enableBiometric: checked})
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="two-factor" className="text-base">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Switch
                  id="two-factor"
                  checked={securitySettings.enableTwoFactor}
                  onCheckedChange={(checked) => 
                    setSecuritySettings({...securitySettings, enableTwoFactor: checked})
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="login-alerts" className="text-base">Login Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications on new device logins
                  </p>
                </div>
                <Switch
                  id="login-alerts"
                  checked={securitySettings.loginAlerts}
                  onCheckedChange={(checked) => 
                    setSecuritySettings({...securitySettings, loginAlerts: checked})
                  }
                />
              </div>
            </div>
            
            <Button 
              onClick={handleSaveSecurity} 
              disabled={isUpdating}
              className="w-full"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Security Settings"
              )}
            </Button>
            
            <div className="space-y-4 border-t border-gray-700 pt-4 mt-4">
              <h3 className="font-medium text-white">Change Password</h3>
              
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={passwordFields.currentPassword}
                  onChange={(e) => setPasswordFields({...passwordFields, currentPassword: e.target.value})}
                  placeholder="Enter current password"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwordFields.newPassword}
                  onChange={(e) => setPasswordFields({...passwordFields, newPassword: e.target.value})}
                  placeholder="Enter new password"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwordFields.confirmPassword}
                  onChange={(e) => setPasswordFields({...passwordFields, confirmPassword: e.target.value})}
                  placeholder="Confirm new password"
                />
              </div>
              
              <Button 
                onClick={handleChangePassword} 
                disabled={isUpdating || !passwordFields.currentPassword || !passwordFields.newPassword || !passwordFields.confirmPassword}
                className="w-full"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Change Password"
                )}
              </Button>
            </div>
            
            <div className="border-t border-gray-700 pt-4 mt-4">
              <h3 className="font-medium text-red-500 mb-2">Danger Zone</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    Delete Account
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Delete account</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete your account? All of your data will be permanently removed.
                      This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-sm text-muted-foreground">
                      Please type <strong>delete</strong> to confirm.
                    </p>
                    <Input
                      className="mt-2"
                      placeholder="Type 'delete' to confirm"
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteAccount}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete Account"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}