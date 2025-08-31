import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Club {
  id: string;
  name: string;
  category: string;
  created_at?: string;
}

const clubsKey = ['admin', 'clubs'];

async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}

export function useAdminClubs() {
  const qc = useQueryClient();

  const { data = [], isLoading, isError, error } = useQuery<Club[]>({
    queryKey: clubsKey,
    queryFn: async () => {
      const token = await getAuthToken();
      const res = await fetch('/api/admin/clubs', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch clubs');
      return res.json();
    },
    staleTime: 2 * 60 * 1000,
  });

  const deleteClub = useMutation({
    mutationFn: async (id: string) => {
      const token = await getAuthToken();
      const res = await fetch(`/api/admin/clubs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete club');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: clubsKey }),
  }).mutateAsync;

  return { clubs: data, isLoading, isError, error, deleteClub };
}
