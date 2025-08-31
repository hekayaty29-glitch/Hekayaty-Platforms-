import { Helmet } from "react-helmet";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "@/components/auth/AuthForms";
import { Link, useLocation } from "wouter";
import signBg from "@/assets/3ea43a58-b1c6-48e0-8ece-a5c70df1786c_15-36-55.jpg";
import { useEffect, useState } from "react";

export default function SignUpPage() {
  const [location] = useLocation();
  const [isPremium, setIsPremium] = useState(false);
  
  useEffect(() => {
    // Check if the URL has a premium query parameter
    const searchParams = new URLSearchParams(location.split('?')[1]);
    setIsPremium(searchParams.get('premium') === 'true');
  }, [location]);
  
  return (
    <>
      <Helmet>
        <title>Sign Up - HEKAYATY</title>
        <meta name="description" content="Create your HEKAYATY account to start reading and publishing fantasy stories." />
      </Helmet>
      
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 bg-cover bg-center" style={{ backgroundImage: `url(${signBg})` }}>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block text-3xl font-cinzel font-bold">
              <span className="text-amber-500">Heka</span>yaty
            </Link>
            <h1 className="text-2xl font-cinzel font-bold text-white mt-6">
              {isPremium ? "Join HEKAYATY Premium" : "Create Your Account"}
            </h1>
            <p className="text-amber-400 mt-2 font-cormorant text-lg italic">
              {isPremium 
                ? "Begin your premium storytelling journey today" 
                : "Join our community of readers and writers"}
            </p>
          </div>
          
          <Card className="border-amber-500/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-center text-amber-500">Sign Up</CardTitle>
              <CardDescription className="text-center">
                Enter your details to create your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RegisterForm isPremium={isPremium} />
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 border-t pt-5 border-amber-500/20">
              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link href="/login" className="text-amber-500 hover:text-amber-700 font-medium">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}
