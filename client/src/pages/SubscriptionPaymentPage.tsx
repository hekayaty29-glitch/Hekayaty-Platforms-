import React from "react";

export default function SubscriptionPaymentPage() {
    const qs = new URLSearchParams(window.location.search);
  const plan = qs.get("plan") ?? "";
  const id = qs.get("id") ?? "";

  const methods = [
    {
      label: "Vodafone Cash",
      value: "vodafone",
      logo: "https://upload.wikimedia.org/wikipedia/commons/5/55/Vodafone_2017_logo.svg",
    },
    {
      label: "PayPal",
      value: "paypal",
      logo: "https://www.paypalobjects.com/webstatic/icon/pp258.png",
    },
    {
      label: "Fawry",
      value: "fawry",
      logo: "https://seeklogo.com/images/F/fawry-logo-3B7AE2343C-seeklogo.com.png",
    },
  ] as const;

  const handlePay = (method: string) => {
    window.location.href = `/subscription/success?plan=${plan}&id=${encodeURIComponent(id)}&method=${method}`;
  };

    


  return (
    <div className="min-h-screen flex items-center justify-center bg-[#151008] text-amber-50 px-4 py-16">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="font-cinzel text-3xl text-amber-500">Choose Payment Method</h1>
        <p className="text-amber-200">Plan: <span className="font-semibold">{plan}</span> • Identifier: <span className="font-semibold">{id}</span></p>
        <div className="grid gap-4">
          {methods.map((m) => (
            <button
              key={m.value}
              onClick={() => handlePay(m.value)}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <span className="flex items-center justify-center gap-2"><img src={m.logo} alt={m.label} className="h-5 w-5" /> {m.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
