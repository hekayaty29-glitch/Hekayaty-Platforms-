import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/* ---------- Types ---------- */
export interface Comic {
  id: string;
  title: string;
  cover: string;
  tags: string[];
}

/* ---------- Helpers ---------- */
const featuredComicsKey = () => ['comics', 'featured'];

const mapComic = (row: any): Comic => ({
  id: row.id,
  title: row.title,
  cover: row.cover_url,
  tags: row.tags ?? [],
});

/* ---------- Hook ---------- */
async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}

export function useFeaturedComics() {
  const qc = useQueryClient();

  /* ---- List featured comics ---- */
  const { data, isLoading, isError, error } = useQuery({
    queryKey: featuredComicsKey(),
    queryFn: async () => {
      const res = await fetch('/api/public/featured-comics');
      if (!res.ok) throw new Error('Failed to fetch featured comics');
      const rows = await res.json();
      return rows.map(mapComic);
    },
  });

  /* ---- Mutations ---- */
  const addComic = useMutation({
    mutationFn: async (comic: Omit<Comic, 'id'>) => {
      const token = await getAuthToken();
      const res = await fetch('/api/admin/comics/featured', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(comic),
      });
      if (!res.ok) throw new Error('Failed to add comic');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: featuredComicsKey() }),
  }).mutateAsync;

  const updateComic = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Comic> }) => {
      const token = await getAuthToken();
      const res = await fetch(`/api/admin/comics/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update comic');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: featuredComicsKey() }),
  }).mutateAsync;

  const deleteComic = useMutation({
    mutationFn: async (id: string) => {
      const token = await getAuthToken();
      const res = await fetch(`/api/admin/comics/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete comic');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: featuredComicsKey() }),
  }).mutateAsync;

  return {
    comics: data ?? [],
    isLoading,
    isError,
    error,
    addComic,
    updateComic,
    deleteComic,
  };
}