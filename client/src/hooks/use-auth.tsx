import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import * as localDB from "@/services/localDatabase";
import * as syncService from "@/services/syncService";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
    refetch: refetchUser,
  } = useQuery<SelectUser | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    // Ensure we properly cache user data and refresh periodically
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const loginMutation = useMutation<SelectUser, Error, LoginData>({
    mutationFn: async (credentials: LoginData) => {
      try {
        // Try online login first
        if (syncService.isOnline()) {
          // apiRequest already parses the JSON response
          const userData = await apiRequest<SelectUser>("POST", "/api/login", credentials);
          
          // Save user data to local database for offline use
          await localDB.saveCurrentUser({
            ...userData,
            isLoggedIn: true
          });
          
          return userData;
        } else {
          // Try offline login
          const allUsers = await localDB.getAllFromStore<localDB.LocalUser>(localDB.STORES.USERS);
          const user = allUsers.find(u => u.username === credentials.username);
          
          if (!user) {
            throw new Error("Cannot login offline: User not found in local database.");
          }
          
          // We don't have the password hash locally, so we're just checking username
          // This is not secure, but allows basic offline functionality
          // A real solution would require storing password hashes locally
          
          // Mark the user as logged in
          await localDB.saveCurrentUser({
            ...user,
            isLoggedIn: true
          });
          
          // Convert local user type to SelectUser type
          return {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
            balance: user.balance,
            password: "" // Add dummy password to match SelectUser type
          } as SelectUser;
        }
      } catch (error) {
        // Format the error message nicely for the user
        let message = (error as Error).message;
        
        // More user-friendly error messages
        if (message.includes("Invalid username or password") || message.includes("username") || message.includes("password")) {
          message = "The username or password you entered is incorrect.";
        } else if (message.includes("401") || message.includes("unauthorized")) {
          message = "Your session has expired. Please log in again.";
        } else if (message.includes("500")) {
          message = "We're experiencing technical difficulties. Please try again later.";
        } else if (message.includes("offline")) {
          message = "You're currently offline. Only previously logged-in users can access offline mode.";
        } else if (!message || message === "Failed to fetch") {
          message = "Network error. Please check your internet connection.";
        }
        
        console.error("Login error:", error);
        throw new Error(message);
      }
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      // Show success message
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name || user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation<SelectUser, Error, InsertUser>({
    mutationFn: async (credentials: InsertUser) => {
      try {
        // apiRequest already parses the JSON response
        const userData = await apiRequest<SelectUser>("POST", "/api/register", credentials);
        return userData;
      } catch (error) {
        // Clean up the error message for better user experience
        let message = (error as Error).message;
        
        // More user-friendly error messages for different scenarios
        if (message.includes("Username already exists") || message.includes("already taken")) {
          message = "This username is already taken. Please choose another one.";
        } else if (message.includes("Email already exists")) {
          message = "This email is already registered. Please use another email or try logging in.";
        } else if (message.includes("Password") && message.includes("requirements")) {
          message = "Your password doesn't meet the security requirements. It should be at least 6 characters long.";
        } else if (message.includes("Username") && message.includes("requirements")) {
          message = "Your username doesn't meet the requirements. It should be at least 3 characters long.";
        } else if (message.includes("500")) {
          message = "We're experiencing technical difficulties. Please try again later.";
        } else if (!message || message === "Failed to fetch") {
          message = "Network error. Please check your internet connection.";
        }
        
        console.error("Registration error:", error);
        throw new Error(message);
      }
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      // Show welcome message for new users
      toast({
        title: "Registration successful",
        description: `Welcome to Shillong Teer, ${user.name || user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      try {
        // Try server logout if online
        if (syncService.isOnline()) {
          await apiRequest("POST", "/api/logout");
        } else {
          console.log("Offline logout - will sync when online");
          // Add to sync queue for when we're back online
          await syncService.addToSyncQueue("/api/logout", "POST");
        }
        
        // Always log out locally regardless of online status
        await localDB.logoutCurrentUser();
      } catch (error) {
        // Even if the logout fails server-side, we still want to clear local data
        console.error("Logout error (will still clear local session):", error);
        
        // Clear local session data regardless of server response
        queryClient.setQueryData(["/api/user"], null);
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        await localDB.logoutCurrentUser();
        
        // Check if this was a network error
        const errorMessage = (error as Error).message;
        if (!errorMessage || errorMessage === "Failed to fetch" || errorMessage.includes("network")) {
          // If it's a network error, assume the user is offline and just clear local data
          throw new Error("You've been logged out locally, but changes may not be synced with the server until you reconnect");
        }
        
        throw error;
      }
    },
    onSuccess: () => {
      // Clear all cached user data when logging out
      queryClient.setQueryData(["/api/user"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
    },
    onError: (error: Error) => {
      // In most cases, we still want the user to feel logged out
      // even if there was a server error
      if (error.message.includes("You've been logged out locally")) {
        toast({
          title: "Logged out",
          description: error.message,
          variant: "default",
        });
      } else {
        toast({
          title: "Logout issue",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
