import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/* ------------------------------------------------------------------ */
/*  Types & helpers                                                   */
/* ------------------------------------------------------------------ */

export type HoqCategory = "best" | "active" | "competition" | "honorable";

export interface HoqEntry {
  id: string;
  user_id: string;
  order_index: number;
  category: HoqCategory;
}

const listKey = (cat: HoqCategory) => ["hall-of-quills", cat];

/* ------------------------------------------------------------------ */
/*  Auth helper                                                       */
/* ------------------------------------------------------------------ */

async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}

/* ------------------------------------------------------------------ */
/*  List hook                                                         */
/* ------------------------------------------------------------------ */

export function useHoqList(category: HoqCategory) {
  return useQuery<HoqEntry[]>({
    queryKey: listKey(category),
    queryFn: async () => {
      const token = await getAuthToken();
      const res = await fetch(`/api/admin/hall-of-quills?category=${category}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch Hall of Quills list');
      return res.json();
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Mutations                                                         */
/* ------------------------------------------------------------------ */

export function useHoqMutations(category: HoqCategory) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: listKey(category) });

  /* ---------- add ---------- */
  const add = useMutation({
    mutationFn: async (userId: string) => {
      const token = await getAuthToken();
      const res = await fetch('/api/admin/hall-of-quills', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category, user_id: userId }),
      });
      if (!res.ok) throw new Error('Failed to add entry');
    },
    onSuccess: invalidate,
  }).mutateAsync;

  /* ---------- remove ---------- */
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const token = await getAuthToken();
      const res = await fetch(`/api/admin/hall-of-quills/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to remove entry');
    },
    onSuccess: invalidate,
  }).mutateAsync;

  /* ---------- reorder ---------- */
  const reorder = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const token = await getAuthToken();
      const res = await fetch('/api/admin/hall-of-quills/reorder', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category, orderedIds }),
      });
      if (!res.ok) throw new Error('Failed to reorder');
    },
    onSuccess: invalidate,
  }).mutateAsync;

  return { add, remove, reorder };
}