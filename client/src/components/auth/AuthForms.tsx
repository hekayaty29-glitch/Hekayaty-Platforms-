import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, CircleAlert } from "lucide-react";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export function LoginForm() {
  const { login, loginWithGoogle } = useAuth();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    setError("");
    
    try {
      await login(data.username, data.password);
      navigate("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-900 p-3 rounded-md flex items-start text-sm">
            <CircleAlert className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        
        {/* Google login */}
        <Button type="button" variant="outline" className="w-full flex items-center justify-center gap-2" onClick={() => loginWithGoogle()}>
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="h-5 w-5" />
          Continue with Google
        </Button>
        {/* Divider */}
        <div className="flex items-center my-2">
          <span className="flex-grow border-t border-amber-300" />
          <span className="px-2 text-sm text-amber-600">or</span>
          <span className="flex-grow border-t border-amber-300" />
        </div>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-cinzel text-amber-600">Username</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter your username" 
                  className="border-amber-500/50 focus:border-amber-500"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-cinzel text-amber-500">Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password" 
                    className="border-amber-500/50 focus:border-amber-500 pr-10"
                    {...field}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-amber-500"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Checkbox id="remember" className="border-amber-500 data-[state=checked]:bg-amber-500" />
            <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
              Remember me
            </label>
          </div>
          
          <Link href="/forgot-password" className="text-amber-500 hover:text-amber-700 text-sm">Forgot password?</Link>
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-cinzel"
          disabled={isLoading}
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>
      </form>
    </Form>
  );
}

// Register form schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  fullName: z.string().min(2, "Full name is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Password must contain at least one letter"),
  confirmPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Password must contain at least one letter"),
  agreeTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions",
  }),
  isPremium: z.boolean().optional()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

interface RegisterFormProps {
  isPremium?: boolean;
}

export function RegisterForm({ isPremium = false }: RegisterFormProps) {
  const { register, login, loginWithGoogle } = useAuth();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      password: "",
      confirmPassword: "",
      agreeTerms: false,
      isPremium: isPremium
    },
  });
  
  const onSubmit = async (data: z.infer<typeof registerSchema>) => {
    setIsLoading(true);
    setError("");
    
    try {
      // Register user
      await register({
        username: data.username,
        email: data.email,
        fullName: data.fullName,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });

      // Supabase signUp already creates a session when email confirmation is disabled.
      // Only attempt sign-in if no session was returned (edge case)
      try {
        await login(data.username, data.password);
      } catch {}

      // If registration specified premium, handle upgrade
      if (data.isPremium) {
        navigate("/upgrade");
      } else {
        // Small delay to ensure auth state is established
        setTimeout(() => {
          navigate("/setup-username");
        }, 100);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-900 p-3 rounded-md flex items-start text-sm">
            <CircleAlert className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        
        {/* Google sign up */}
        <Button type="button" variant="outline" className="w-full flex items-center justify-center gap-2" onClick={() => loginWithGoogle()}>
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="h-5 w-5" />
          Continue with Google
        </Button>
        {/* Divider */}
        <div className="flex items-center my-2">
          <span className="flex-grow border-t border-amber-300" />
          <span className="px-2 text-sm text-amber-600">or</span>
          <span className="flex-grow border-t border-amber-300" />
        </div>
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-cinzel text-amber-400">Full Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter your full name" 
                  className="border-amber-500/50 focus:border-amber-500"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-cinzel text-amber-400">Username</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Choose a username" 
                    className="border-amber-500/50 focus:border-amber-500"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-cinzel text-amber-400">Email</FormLabel>
                <FormControl>
                  <Input 
                    type="email"
                    placeholder="Enter your email" 
                    className="border-amber-500/50 focus:border-amber-500"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-cinzel text-amber-500">Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password" 
                    className="border-amber-500/50 focus:border-amber-500 pr-10"
                    {...field}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-amber-500"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-cinzel text-amber-500">Confirm Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password" 
                    className="border-amber-500/50 focus:border-amber-500 pr-10"
                    {...field}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-amber-500"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="agreeTerms"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox 
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="border-amber-500 data-[state=checked]:bg-amber-500"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm text-gray-600">
                  I agree to the <a href="/terms" className="text-amber-500 hover:text-amber-700">Terms of Service</a> and <a href="/privacy" className="text-amber-500 hover:text-amber-700">Privacy Policy</a>
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className={`w-full text-white font-cinzel ${isPremium ? 'bg-gold-rich hover:bg-amber-600' : 'bg-amber-500 hover:bg-amber-600'}`}
          disabled={isLoading}
        >
          {isLoading ? "Creating Account..." : (isPremium ? "Sign Up for Premium" : "Create Account")}
        </Button>
      </form>
    </Form>
  );
}
