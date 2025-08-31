import { useQuery } from '@tanstack/react-query';

export interface UserStats {
  id: string;
  username: string;
  email: string;
  stories_published: number;
  words_written: number;
  bookmarks_received: number;
  vip_since?: string;
  joined_at: string;
}

export function useAdminUserStats(userId: string) {
  return useQuery<UserStats>({
    queryKey: ['admin', 'user-stats', userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}/stats`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to fetch user stats');
      return res.json();
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}
