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
  agreeTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and disclaimer to continue",
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
      agreeTerms: false,
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
    
    // Remove agreeTerms from submission data as it's not part of the user schema
    const { agreeTerms, ...userInfo } = values;
    
    registerMutation.mutate(userInfo, {
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-50/30 to-blue-50/20"></div>
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
      
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 relative z-10">
        {/* Left side: Auth Form */}
        <div className="bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/50">
          <div className="flex justify-center mb-6">
            <div className="flex items-center">
              <div className="bg-primary w-10 h-10 rounded-full flex items-center justify-center mr-2">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Shillong Teer</h1>
            </div>
          </div>
          
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100">
              <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:text-primary">Login</TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-white data-[state=active]:text-primary">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
                  {loginMutation.error && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md text-sm border border-red-100" role="alert">
                      {loginMutation.error.message}
                    </div>
                  )}
                  
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Username</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your username" 
                            {...field} 
                            className="border-gray-200 bg-white" 
                            autoComplete="username"
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Password</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input 
                              type={showLoginPassword ? "text" : "password"} 
                              placeholder="Enter your password" 
                              {...field} 
                              className="border-gray-200 bg-white pr-10" 
                              autoComplete="current-password"
                            />
                          </FormControl>
                          <button 
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                  
                  {/* Login Disclaimer Notice */}
                  <div className="mt-2 mb-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                      <div className="text-xs text-gray-600">
                        <p className="flex items-center mb-1">
                          <span className="bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded text-xs font-medium mr-1">Notice</span>
                        </p>
                        <p>By logging in, you confirm that you are at least 18 years old and accept that this app is intended solely for participating in Shillong Teer, a legally recognized traditional archery-based game.</p>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-white py-2 h-11"
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
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md text-sm border border-red-100" role="alert">
                      {registerMutation.error.message}
                    </div>
                  )}
                  
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Username</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Choose a username" 
                            {...field} 
                            className="border-gray-200 bg-white"
                            autoComplete="username"
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Password</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input 
                              type={showRegisterPassword ? "text" : "password"} 
                              placeholder="Create a password" 
                              {...field}
                              className="border-gray-200 bg-white pr-10"
                              autoComplete="new-password"
                            />
                          </FormControl>
                          <button 
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                        <FormMessage className="text-red-500" />
                        <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters with letters and numbers</p>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Full Name <span className="text-gray-400 text-xs">(Optional)</span></FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your full name" 
                            {...field} 
                            className="border-gray-200 bg-white"
                            autoComplete="name"
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Email <span className="text-gray-400 text-xs">(Optional)</span></FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your email" 
                            {...field}
                            className="border-gray-200 bg-white"
                            autoComplete="email"
                            type="email"
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                  
                  {/* Disclaimer and Age Verification */}
                  <div className="mt-4 mb-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-3">
                      <h3 className="text-gray-700 text-sm font-medium flex items-center mb-2">
                        <span className="bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded text-xs font-medium mr-2">Disclaimer</span>
                      </h3>
                      <div className="text-xs text-gray-600 space-y-2">
                        <p>This app is intended solely for participating in Shillong Teer, a legally recognized traditional archery-based number game.</p>
                        <p>Please note:</p>
                        <ul className="list-disc pl-4 space-y-1">
                          <li>This game involves monetary risk and may be addictive.</li>
                          <li>Play responsibly and only if you are confident and aware of the rules.</li>
                          <li>We do not promote gambling or betting of any kind beyond the scope of Shillong Teer.</li>
                          <li>Users must be 18 years or older to use this app.</li>
                          <li>If you feel like you're losing control or getting addicted, please take a break or seek help.</li>
                        </ul>
                      </div>
                    </div>
                    
                    <FormField
                      control={registerForm.control}
                      name="agreeTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="mt-1 rounded border-gray-300 text-primary"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm text-gray-600">
                              I am at least 18 years old and I accept the terms and disclaimer
                            </FormLabel>
                            <FormMessage className="text-red-500" />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-white py-2 h-11"
                    disabled={registerMutation.isPending || Object.keys(registerErrors).length > 0}
                  >
                    {registerMutation.isPending ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating account...
                      </div>
                    ) : (
                      "Register"
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Right side: Hero Section */}
        <div className="bg-gradient-to-br from-primary via-purple-600 to-blue-600 p-8 hidden md:flex md:flex-col md:justify-center rounded-2xl shadow-2xl relative overflow-hidden">
          {/* Decorative pattern overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px'}}></div>
          </div>
          
          <div className="text-center relative z-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mb-6">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                <span className="text-primary font-bold text-3xl">S</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">Welcome to Shillong Teer</h2>
            <p className="text-white/90 mb-8 text-lg">The premier platform for Shillong Teer betting with live results and secure payments.</p>
            
            <div className="space-y-4">
              <div className="flex items-center text-left bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mr-4">
                  <i className="ri-gamepad-line text-2xl text-white"></i>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Place Bets Easily</h3>
                  <p className="text-white/80 text-sm">Select from 00-99 numbers and place bets with just a few taps</p>
                </div>
              </div>
              
              <div className="flex items-center text-left bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mr-4">
                  <i className="ri-wallet-3-line text-2xl text-white"></i>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Secure Wallet</h3>
                  <p className="text-white/80 text-sm">Deposit and withdraw funds securely through various payment methods</p>
                </div>
              </div>
              
              <div className="flex items-center text-left bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mr-4">
                  <i className="ri-ai-generate text-2xl text-white"></i>
                </div>
                <div>
                  <h3 className="text-white font-semibold">AI Predictions</h3>
                  <p className="text-white/80 text-sm">Get number suggestions based on historical trends and patterns</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
