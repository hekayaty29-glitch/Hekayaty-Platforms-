import { toast } from "sonner";
import { useRoles } from "@/hooks/useRoles";

// Constants
const FREE_LIMIT = 5;

function monthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}`; // e.g. 2025-7
}

function getCounter() {
  const raw = localStorage.getItem("downloads_per_month");
  const parsed: Record<string, number> = raw ? JSON.parse(raw) : {};
  return parsed;
}

function saveCounter(data: Record<string, number>) {
  localStorage.setItem("downloads_per_month", JSON.stringify(data));
}

export function canDownload(): { allowed: boolean; remaining: number } {
  const counters = getCounter();
  const key = monthKey();
  const used = counters[key] ?? 0;
  return { allowed: used < FREE_LIMIT, remaining: Math.max(FREE_LIMIT - used, 0) };
}

export function registerDownload() {
  const counters = getCounter();
  const key = monthKey();
  counters[key] = (counters[key] ?? 0) + 1;
  saveCounter(counters);
}

/**
 * Convenience helper for components.
 * Example usage:
 *   attemptDownload(() => window.open(pdfUrl, "_blank"));
 */
export function attemptDownload(onAllowed: () => void, roles?: ReturnType<typeof useRoles>) {
  const { isVip, isAdmin } = roles ?? { isVip: false, isAdmin: false } as any;
  if (isVip || isAdmin) {
    onAllowed();
    return;
  }
  const { allowed, remaining } = canDownload();
  if (!allowed) {
    toast.error("Monthly download limit reached (5). Upgrade to VIP for unlimited downloads.");
    return;
  }
  registerDownload();
  toast.success(`Download started. ${remaining - 1} free downloads left this month.`);
  onAllowed();
}
