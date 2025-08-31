import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function randomCode(length = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

export default function SubscriptionSuccessPage() {
  const [loc] = useLocation();
  const qs = loc.split("?")[1] ?? "";
  const qp = new URLSearchParams(qs);
  const plan = qp.get("plan") ?? "";
  const id = qp.get("id") ?? "";

  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    if (plan) {
      const generated = `${plan}-${randomCode()}`;
      setCode(generated);
      // save to localStorage
      const list = JSON.parse(localStorage.getItem("hek_sub_codes") || "[]");
      list.push({ id, plan, code: generated, ts: Date.now() });
      localStorage.setItem("hek_sub_codes", JSON.stringify(list));
    }
  }, [plan, id]);

  const handleCopy = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    alert("Code copied to clipboard");
  };

  if (!code) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-600/10 to-amber-50/30 py-16 px-4 text-center">
      <Helmet><title>Subscription Success – HEKAYATY</title></Helmet>
      <Card className="w-full max-w-md border-amber-500/30">
        <CardHeader>
          <CardTitle className="font-cinzel text-xl text-brown-dark">🎉 Success!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-700">Your subscription code is:</p>
          <div className="text-2xl font-mono tracking-wider text-amber-700 bg-amber-100 border border-amber-500 rounded p-4 select-all">
            {code}
          </div>
          <Button onClick={handleCopy} className="bg-amber-600 hover:bg-amber-700 text-white w-full">Copy to Clipboard</Button>
          <p className="text-sm text-gray-600">Redeem at <a href="https://hekayaty.com/redeem" className="text-amber-600 underline">hekayaty.com/redeem</a></p>
        </CardContent>
      </Card>
    </div>
  );
}
