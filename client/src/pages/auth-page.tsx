import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Please enter a valid email").optional(),
  agreeTerms: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the terms and disclaimer to continue" }),
  }),
});

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Redirect if already logged in
  if (user) {
    navigate("/");
    return null;
  }

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      email: "",
    },
  });

  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    // If already in a login/register process, don't submit again
    if (loginMutation.isPending || registerMutation.isPending) {
      return;
    }
    
    loginMutation.mutate(values, {
      onSuccess: () => {
        // Toast notification is handled in the mutation
        navigate("/");
      },
    });
  };

  const onRegisterSubmit = (values: z.infer<typeof registerSchema>) => {
    // If already in a login/register process, don't submit again
    if (loginMutation.isPending || registerMutation.isPending) {
      return;
    }
    
    registerMutation.mutate(values, {
      onSuccess: () => {
        // Toast notification is handled in the mutation
        navigate("/");
      },
    });
  };

  // Get any form validation errors
  const loginErrors = loginForm.formState.errors;
  const registerErrors = registerForm.formState.errors;

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 rounded-lg overflow-hidden">
        {/* Left side: Auth Form */}
        <div className="bg-secondary p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">Shillong Teer</h1>
          
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                  {loginMutation.error && (
                    <div className="bg-destructive/20 text-destructive-foreground px-4 py-3 rounded-md text-sm" role="alert">
                      {loginMutation.error.message}
                    </div>
                  )}
                  
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Username</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your username" 
                            {...field} 
                            className="bg-gray-800 border-gray-700 text-white" 
                            autoComplete="username"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Password</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input 
                              type={showLoginPassword ? "text" : "password"} 
                              placeholder="Enter your password" 
                              {...field} 
                              className="bg-gray-800 border-gray-700 pr-10 text-white" 
                              autoComplete="current-password"
                            />
                          </FormControl>
                          <button 
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                            aria-label={showLoginPassword ? "Hide password" : "Show password"}
                          >
                            {showLoginPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-accent hover:bg-accent/90 text-white"
                    disabled={loginMutation.isPending || Object.keys(loginErrors).length > 0}
                  >
                    {loginMutation.isPending ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Logging in...
                      </div>
                    ) : (
                      "Login"
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  {registerMutation.error && (
                    <div className="bg-destructive/20 text-destructive-foreground px-4 py-3 rounded-md text-sm" role="alert">
                      {registerMutation.error.message}
                    </div>
                  )}
                  
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Username</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Choose a username" 
                            {...field} 
                            className="bg-gray-800 border-gray-700 text-white"
                            autoComplete="username"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Password</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input 
                              type={showRegisterPassword ? "text" : "password"} 
                              placeholder="Create a password" 
                              {...field} 
                              className="bg-gray-800 border-gray-700 pr-10 text-white"
                              autoComplete="new-password"
                            />
                          </FormControl>
                          <button 
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                            onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                            aria-label={showRegisterPassword ? "Hide password" : "Show password"}
                          >
                            {showRegisterPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        <FormMessage />
                        <p className="text-xs text-gray-400 mt-1">Must be at least 6 characters with letters and numbers</p>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Full Name (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your full name" 
                            {...field} 
                            className="bg-gray-800 border-gray-700 text-white"
                            autoComplete="name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Email (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your email" 
                            {...field} 
                            className="bg-gray-800 border-gray-700 text-white"
                            autoComplete="email"
                            type="email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-accent hover:bg-accent/90 text-white"
                    disabled={registerMutation.isPending || Object.keys(registerErrors).length > 0}
                  >
                    {registerMutation.isPending ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Account...
                      </div>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Right side: Hero Section */}
        <div className="bg-gray-900 p-8 hidden md:flex md:flex-col md:justify-center rounded-lg">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Welcome to Shillong Teer</h2>
            <p className="text-gray-300 mb-8">The premier platform for Shillong Teer betting with live results and secure payments.</p>
            
            <div className="space-y-4">
              <div className="flex items-center text-left bg-secondary/40 rounded-lg p-4">
                <i className="ri-gamepad-line text-2xl text-accent mr-4"></i>
                <div>
                  <h3 className="text-white font-medium">Place Bets Easily</h3>
                  <p className="text-gray-400 text-sm">Select from 00-99 numbers and place bets with just a few taps</p>
                </div>
              </div>
              
              <div className="flex items-center text-left bg-secondary/40 rounded-lg p-4">
                <i className="ri-wallet-3-line text-2xl text-accent mr-4"></i>
                <div>
                  <h3 className="text-white font-medium">Secure Wallet</h3>
                  <p className="text-gray-400 text-sm">Deposit and withdraw funds securely through various payment methods</p>
                </div>
              </div>
              
              <div className="flex items-center text-left bg-secondary/40 rounded-lg p-4">
                <i className="ri-ai-generate text-2xl text-accent mr-4"></i>
                <div>
                  <h3 className="text-white font-medium">AI Predictions</h3>
                  <p className="text-gray-400 text-sm">Get number suggestions based on historical trends and patterns</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
