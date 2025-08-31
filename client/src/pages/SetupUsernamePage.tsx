import { Helmet } from "react-helmet";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { CircleAlert } from "lucide-react";

const schema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  fullName: z.string().min(2, "Full name is required"),
});

type FormData = z.infer<typeof schema>;

export default function SetupUsernamePage() {
  const { user, updateUser } = useAuth();
  const [, navigate] = useLocation();
  
  // Debug: Check if we have a user from auth context
  console.log('SetupUsernamePage - Auth user:', user);
  console.log('SetupUsernamePage - URL params:', window.location.search);
  
  // Check for OAuth errors in URL
  const urlParams = new URLSearchParams(window.location.search);
  const oauthError = urlParams.get('error_description');
  
  useEffect(() => {
    if (oauthError) {
      setError(`OAuth Error: ${decodeURIComponent(oauthError)}`);
    }
  }, [oauthError]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Exchange PKCE code for session on first load (safe no-op if not present)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      supabase.auth.exchangeCodeForSession(code).catch(() => {});
    }
  }, []);

  // Listen for auth state changes (OAuth callback)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session);
      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in via OAuth:', session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      fullName: (user as any)?.full_name || "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError("");
    try {
      const res = await apiRequest("POST", "/api/auth/complete-profile", data);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to complete profile");
      // update auth context so navbar shows new username immediately
      updateUser({ username: data.username, fullName: data.fullName });
      navigate("/profile");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Complete Profile - HEKAYATY</title>
      </Helmet>
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 bg-gradient-to-b from-brown-dark to-brown-900">
        <div className="w-full max-w-md bg-[#1e1a14] p-6 rounded-lg shadow-lg border border-amber-500/30">
          <h1 className="text-2xl font-cinzel text-center text-amber-500 mb-6">Complete Your Profile</h1>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-900 p-3 rounded-md flex items-start text-sm">
                  <CircleAlert className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-cinzel text-amber-400">Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" className="border-amber-500/50 focus:border-amber-500" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-cinzel text-amber-600">Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Choose a username" className="border-amber-500/50 focus:border-amber-500" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white font-cinzel" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save and Continue"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </>
  );
}
