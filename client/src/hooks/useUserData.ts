import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/**
 * React-Query key helpers
 */
const profileKey = (id: string | undefined) => ["profile", id]; // id may be undefined during initial loading
const storiesKey = (id: string | undefined) => ["stories", "byUser", id];

/**
 * Fetch a single user row from `public.users` matching the auth.user.id.
 */
export function useUserProfile(userId: string | number | undefined) {
  return useQuery({
    queryKey: profileKey(userId?.toString()),
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, username, full_name, bio, avatar_url, role, is_author, is_premium, premium_expires_at, created_at")
        .eq("id", userId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Update mutable columns of the current user.
 */
/**
 * Create a default user profile row if one does not yet exist.
 * This is used on first visit after sign-up.
 */
export function useEnsureUserProfile(userId: string | number | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!userId) return;
      // attempt to insert row with ON CONFLICT DO NOTHING semantics via upsert
      const { error } = await supabase
        .from("users")
        .upsert({ id: userId, bio: "", avatar_url: "" }, { onConflict: "id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });
}

/**
 * Fetch all comics authored by the user.
 */
export function useUserComics(userId: string | number | undefined) {
  return useQuery({
    queryKey: ["comics", "byUser", userId?.toString()],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comics")
        .select("*")
        .eq("author_id", userId!.toString())
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useUpdateUserProfile(userId: string | number | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const { error } = await supabase.from("users").update(updates).eq("id", userId!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileKey(userId?.toString()) });
    },
  });
}

/**
 * Fetch all stories authored by the user, ordered by newest first.
 */
export function useUserStories(userId: string | number | undefined) {
  return useQuery({
    queryKey: storiesKey(userId?.toString()),
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stories")
        .select("*")
        .eq("author_id", userId!.toString())
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
