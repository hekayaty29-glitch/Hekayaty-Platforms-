import { useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to send reset email");
      }
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#15100A] text-amber-50 px-4">
      <Helmet>
        <title>Forgot Password – Hekayaty</title>
      </Helmet>
      <div className="w-full max-w-md bg-amber-50/10 p-8 rounded-lg border border-amber-500">
        {sent ? (
          <div className="space-y-6 text-center">
            <h1 className="font-cinzel text-2xl">Check your email</h1>
            <p className="text-amber-200">If an account exists for <strong>{email}</strong>, a password-reset link has been sent. It expires in 30 minutes.</p>
            <Button asChild className="bg-amber-500 hover:bg-amber-600 text-brown-dark font-cinzel w-full">
              <Link href="/login">Back to Sign in</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <h1 className="font-cinzel text-2xl text-center">Forgot Password</h1>
            <div>
              <label htmlFor="email" className="block text-sm mb-1">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md bg-midnight-blue border border-amber-500 p-2 focus:outline-none"
                required
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-brown-dark font-cinzel" disabled={loading}>
              {loading ? "Sending…" : "Send Reset Link"}
            </Button>
            <p className="text-center text-sm text-amber-200">
              Remembered your password? {" "}
              <Link href="/login" className="text-amber-400 hover:underline">Sign in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
