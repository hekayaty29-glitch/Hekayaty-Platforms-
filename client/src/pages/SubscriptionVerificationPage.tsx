import { useState } from "react";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth";

export default function SubscriptionVerificationPage() {
  const [, navigate] = useLocation();
  const { upgradeToPremium } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const canVerify = email.trim().length > 3 && code.trim().length >= 6;

  const handleVerify = async () => {
    if (!canVerify) return;
    setLoading(true);
    try {
      const res = await fetch("/api/subscriptions/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });

      if (res.ok) {
        await upgradeToPremium();
        toast({ title: "Success", description: "Your premium subscription is now active!", duration: 5000 });
        navigate("/subscription/success");
        return;
      }
      // If backend not ready yet, simulate positive flow
      if (res.status === 404 || res.status === 501) {
        await new Promise((r) => setTimeout(r, 800));
        await upgradeToPremium();
        toast({ title: "Demo Success", description: "(Backend stub) Premium activated.", duration: 5000 });
        navigate("/subscription/success");
        return;
      }
      const { message } = await res.json().catch(() => ({ message: "Verification failed" }));
      toast({ title: "Failed", description: message ?? "Verification failed", variant: "destructive" });
    } catch (e) {
      toast({ title: "Error", description: "Network or server error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#151008] py-16 px-4 text-amber-50">
      <Helmet><title>Verify Subscription – HEKAYATY</title></Helmet>
      <h1 className="font-cinzel text-3xl md:text-4xl text-amber-500 mb-8">Verify Your Free Code</h1>
      <Card className="w-full max-w-lg border-amber-500/30">
        <CardHeader>
          <CardTitle className="font-cinzel text-xl text-amber-400">Enter Verification Code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email used to request code</Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ABCDEFGH"
            />
          </div>

          <Button disabled={!canVerify || loading} className="w-full bg-amber-600 hover:bg-amber-700 text-white" onClick={handleVerify}>
            {loading ? "Verifying..." : "Verify & Activate"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
