import { Progress } from "@/components/ui/progress";
import { useRoles } from "@/hooks/useRoles";
import { useQuery } from "@tanstack/react-query";

export default function DownloadLimitBanner() {
  const { isFree } = useRoles();

  if (!isFree) return null;

  const { data } = useQuery<{ remaining: number; total: number }>({
    queryKey: ["downloads-remaining"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/downloads/remaining");
        if (!res.ok) throw new Error();
        return res.json();
      } catch {
        // fallback mock: 5 total
        return { remaining: 5, total: 5 };
      }
    },
    refetchInterval: 60_000,
  });

  if (!data) return null;

  const pct = ((data.total - data.remaining) / data.total) * 100;

  return (
    <div className="w-full bg-amber-900/20 text-amber-200 px-4 py-2 text-sm flex flex-col items-center gap-2">
      <span>
        Downloads this month: {data.total - data.remaining}/{data.total} (Remaining {data.remaining})
      </span>
      <div className="w-full max-w-md">
        <Progress value={pct} className="bg-amber-700/30 [&>div]:bg-amber-500" />
      </div>
    </div>
  );
}
