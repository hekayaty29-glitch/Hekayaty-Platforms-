import { useQuery } from '@tanstack/react-query';

export interface DailyMetric {
  date: string; // YYYY-MM-DD
  visits: number;
  revenue_cents: number;
  new_users: number;
}

export function useAdminAnalytics() {
  return useQuery<DailyMetric[]>({
    queryKey: ['admin', 'analytics'],
    queryFn: async () => {
      const res = await fetch('/api/admin/stats/daily');
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
