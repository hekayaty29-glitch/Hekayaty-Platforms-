import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Workshop {
  id: string;
  title: string;
  description: string;
  date: string; // ISO date string
  created_at?: string;
}

const workshopsKey = ['admin', 'workshops'];

async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}

export function useAdminWorkshops() {
  const qc = useQueryClient();

  // list
  const { data = [], isLoading, isError, error } = useQuery<Workshop[]>({
    queryKey: workshopsKey,
    queryFn: async () => {
      const token = await getAuthToken();
      const res = await fetch('/api/admin/workshops', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch workshops');
      return res.json();
    },
    staleTime: 2 * 60 * 1000,
  });

  const addWorkshop = useMutation({
    mutationFn: async (payload: Omit<Workshop, 'id' | 'created_at'>) => {
      const token = await getAuthToken();
      const res = await fetch('/api/admin/workshops', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create workshop');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: workshopsKey }),
  }).mutateAsync;

  const deleteWorkshop = useMutation({
    mutationFn: async (id: string) => {
      const token = await getAuthToken();
      const res = await fetch(`/api/admin/workshops/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete workshop');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: workshopsKey }),
  }).mutateAsync;

  return { workshops: data, isLoading, isError, error, addWorkshop, deleteWorkshop };
}
