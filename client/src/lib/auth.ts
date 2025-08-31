import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "./queryClient";
import { supabase } from "./supabase";
import { AuthUser } from "./types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  upgradeToPremium: () => Promise<void>;
  updateUser: (user: Partial<AuthUser>) => void;
  loginWithGoogle: () => Promise<void>;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Fetch current user
  const { data: user, isLoading } = useQuery({
    queryKey: ['auth','session'],
    queryFn: async ()=>{
      const { data } = await supabase.auth.getUser();
      return data.user;
    }
  });
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      // Determine if input is email or username
      let email = username;
      if (!username.includes('@')) {
        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', username)
          .single();
        if (profErr || !prof?.email) {
          throw new Error('Username not found');
        }
        email = prof.email;
      }
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth','session'] });
      setIsAuthenticated(true);
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });
    },
    onError: () => {
      toast({
        title: "Login failed",
        description: "Please check your username and password.",
        variant: "destructive",
      });
    },
  });
  
  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const { username, email, password, fullName } = userData;
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password, fullName }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Registration failed');
      }
      
      // Show welcome message if user got VIB subscription
      if (result.message.includes('Welcome to Hekayaty Lord')) {
        // Store welcome message to show in UI
        localStorage.setItem('welcomeMessage', result.message);
      }
      
      return result.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth','session'] });
      setIsAuthenticated(true);
      toast({
        title: "Account created!",
        description: "Welcome to TaleKeeper. Your journey begins now.",
      });
    },
    onError: () => {
      toast({
        title: "Registration failed",
        description: "Please try again with different credentials.",
        variant: "destructive",
      });
    },
  });
  
  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.clear();
      setIsAuthenticated(false);
      toast({
        title: "Logged out",
        description: "You've been successfully logged out.",
      });
    },
    onError: () => {
      toast({
        title: "Logout failed",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Google OAuth login
  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth/callback'
      }
    });
    if (error) {
      toast({
        title: 'Google sign-in failed',
        description: error.message,
        variant:'destructive'
      });
    }
  };

  const upgradeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not logged in");
      const userId = (user as any).id;
      const res = await apiRequest("POST", `/api/users/${userId}/premium`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth','session'] });
      toast({
        title: "Upgrade successful!",
        description: "You now have premium access to all features.",
      });
    },
    onError: () => {
      toast({
        title: "Upgrade failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const login = async (username: string, password: string) => {
    await loginMutation.mutateAsync({ username, password });
  };

  const register = async (userData: RegisterData) => {
    await registerMutation.mutateAsync(userData);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };
  
  const upgradeToPremium = async () => {
    await upgradeMutation.mutateAsync();
  };

  useEffect(() => {
    if (user) {
      setIsAuthenticated(true);
    }
  }, [user]);

  // Update user data in context
  const updateUser = (userData: Partial<AuthUser>) => {
    if (user) {
      queryClient.setQueryData(['auth','session'], { ...(user as any), ...userData });
    }
  };

  // Create the context value object
  const value = {
    user: user as unknown as AuthUser | null,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    upgradeToPremium,
    updateUser,
    loginWithGoogle: loginWithGoogle
  };

  // Return the provider with JSX
  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
