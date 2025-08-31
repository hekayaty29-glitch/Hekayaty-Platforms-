import { Helmet } from "react-helmet";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/AuthForms";
import { Link } from "wouter";
import signBg from "@/assets/3ea43a58-b1c6-48e0-8ece-a5c70df1786c_15-36-55.jpg";

export default function SignInPage() {
  return (
    <>
      <Helmet>
        <title>Sign In - HEKAYATY</title>
        <meta name="description" content="Sign in to your HEKAYATY account to continue your reading journey." />
      </Helmet>
      
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 bg-cover bg-center" style={{ backgroundImage: `url(${signBg})` }}>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block text-3xl font-cinzel font-bold">
              <span className="text-amber-500">Heka</span>yaty
            </Link>
            <h1 className="text-2xl font-cinzel font-bold text-white mt-6">Welcome Back</h1>
            <p className="text-white mt-2 font-cormorant text-lg italic" data-component-name="SignInPage">Sign in to continue your reading journey</p>
          </div>
          
          <Card className="border-amber-500/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-center text-amber-600">Sign In</CardTitle>
              <CardDescription className="text-center">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 border-t pt-5 border-amber-500/20">
              <div className="text-center text-sm">
                Don't have an account?{" "}
                <Link href="/register" className="text-amber-500 hover:text-amber-700 font-medium">
                  Create an account
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}
