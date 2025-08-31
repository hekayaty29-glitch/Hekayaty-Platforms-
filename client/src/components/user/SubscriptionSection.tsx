import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

interface Props {
  user: any;
}

export default function SubscriptionSection({ user }: Props) {
  const currentPlan = user.subscriptionPlan ?? "Free";
  const expiry = user.subscriptionExpiry
    ? format(new Date(user.subscriptionExpiry), "PPP")
    : "N/A";

  return (
    <Card className="border-amber-500/30">
      <CardHeader>
        <CardTitle className="font-cinzel">Subscription Plan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Current Plan</p>
            <p className="text-lg font-semibold text-brown-dark">{currentPlan}</p>
          </div>
          <Button variant="secondary" className="bg-amber-600 hover:bg-amber-700 text-white">
            {currentPlan === "Free" ? "Upgrade" : "Renew"}
          </Button>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">Expiration Date</p>
          <p className="text-sm font-medium text-brown-dark">{expiry}</p>
        </div>

        {user.paymentHistory && user.paymentHistory.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-brown-dark">Payment History</p>
            <ul className="space-y-2 max-h-40 overflow-auto pr-2">
              {user.paymentHistory.map((payment: { id: number; amount: number; date: string }) => (
                <li key={payment.id} className="text-sm text-gray-700 flex justify-between">
                  <span>{format(new Date(payment.date), "PPP")}</span>
                  <span className="font-medium">${payment.amount.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
