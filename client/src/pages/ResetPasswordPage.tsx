import { useState } from "react";
import { Helmet } from "react-helmet";
import { useLocation, Redirect, Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  // useLocation returns the current path, querystring included. We'll parse the querystring via window.location
  const [loc] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") || "";

  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return <Redirect to="/" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!code || code.length < 4) {
      setError("Verification code is required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, code, new_password: password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Reset failed");
      }
      setDone(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#15100A] text-amber-50 px-4">
      <Helmet>
        <title>Reset Password - Hekayaty</title>
      </Helmet>
      <div className="w-full max-w-md bg-amber-50/10 p-8 rounded-lg border border-amber-500">
        {done ? (
          <div className="text-center space-y-6">
            <h1 className="font-cinzel text-2xl">Password Updated</h1>
            <p className="text-amber-200">You can now sign in with your new password.</p>
            <Button asChild className="bg-amber-500 hover:bg-amber-600 text-brown-dark font-cinzel w-full">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <h1 className="font-cinzel text-2xl text-center">Reset Password</h1>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1" htmlFor="code">Verification Code</label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full rounded-md bg-midnight-blue border border-amber-500 p-2 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1" htmlFor="password">New Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md bg-midnight-blue border border-amber-500 p-2 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1" htmlFor="confirm">Confirm Password</label>
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full rounded-md bg-midnight-blue border border-amber-500 p-2 focus:outline-none"
                  required
                />
              </div>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-brown-dark font-cinzel">Reset Password</Button>
          </form>
        )}
      </div>
    </div>
  );
}
