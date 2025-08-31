import { useLocation } from "wouter";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function PublishFAB() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();

  if (!isAuthenticated) return null; // hide for guests

  const disabled = !user?.isPremium && (user as any)?.publishedCount >= 2; // example limit, adjust later

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <button
            onClick={() => navigate("/publish")}
            disabled={disabled}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-amber-600 text-white shadow-lg px-4 py-3 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <Plus className="h-5 w-5" />
            <span className="font-semibold hidden sm:inline">Publish</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {disabled ? "Upgrade to publish more" : "Publish a new story"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
