import { useState } from "react";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth";

const PLANS = [
  { label: "1 Month", value: "1month" },
  { label: "Free", value: "2month" },
  { label: "3 Months", value: "3month" },
  { label: "6 Months", value: "6month" },
  { label: "12 Months", value: "12month" },
];

export default function SubscriptionRequestPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [identifier, setIdentifier] = useState(user?.email ?? "");

  const canContinue = !!selected && identifier.trim().length > 2;
  const { toast } = useToast();
  const [freeLoading, setFreeLoading] = useState(false);

  const handleContinue = () => {
    if (!selected) return;
    navigate(`/subscription/payment?plan=${selected}&id=${encodeURIComponent(identifier)}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#151008] py-16 px-4">
      <Helmet><title>Subscription Code – HEKAYATY</title></Helmet>
      <h1 className="font-cinzel text-3xl md:text-4xl text-amber-500 mb-8">Start Your Journey</h1>
      <Card className="w-full max-w-lg border-amber-500/30 text-amber-50">
        <CardHeader>
          <CardTitle className="font-cinzel text-xl text-amber-400">Get a Subscription Code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {PLANS.map((p) => (
              <Button
                key={p.value}
                variant={selected === p.value ? "secondary" : "outline"}
                className={selected === p.value ? "bg-amber-600 text-white" : "border-amber-500 text-white"}
                onClick={() => setSelected(p.value)}
              >
                {p.label}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="identifier">Hekayaty Email / Username</Label>
            <Input
              id="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <Button disabled={!canContinue} className="w-full bg-amber-600 hover:bg-amber-700 text-white" onClick={handleContinue}>
            Continue to Payment
          </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <span className="w-full border-t border-amber-500/30"></span>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-4 text-amber-300 text-sm">OR</span>
              </div>
            </div>

            <Button
              disabled={freeLoading || selected !== "2month" || identifier.trim().length < 3}
              onClick={async () => {
                if (identifier.trim().length < 3) return;
                setFreeLoading(true);
                try {
                  // Request free code
                   const res = await fetch("/api/subscriptions/free", {
                     method: "POST",
                     headers: { "Content-Type": "application/json" },
                     body: JSON.stringify({ email: identifier }),
                   });
                   if (res.status === 410) {
                     toast({
                       title: "Promotion ended",
                       description: "The 2-month free code offer is no longer available.",
                       variant: "destructive",
                     });
                     return; // stop flow
                   }
                   if (!res.ok) {
                     throw new Error("Request failed");
                   }
                   toast({ title: "Free code requested", description: "Check your email for the verification code.", duration: 5000 });
                   navigate(`/subscription/verify?email=${encodeURIComponent(identifier)}`);
                } catch (e) {
                  toast({ title: "Failed", description: "Could not request code", variant: "destructive" });
                } finally {
                  setFreeLoading(false);
                }
              }}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
            >
              {freeLoading ? "Sending..." : "Request Free Code"}
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
