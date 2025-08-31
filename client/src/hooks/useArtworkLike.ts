import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

interface ArtworkLikeData {
  count: number;
  liked: boolean;
}

const likeKey = (artworkId: string) => ["artwork-like", artworkId];

export function useArtworkLike(artworkId: string) {
  const { user } = useAuth();
  const uid = user?.id ?? "";

  return useQuery<ArtworkLikeData>({
    queryKey: likeKey(artworkId),
    queryFn: async () => {
      // count total likes
      const { count, error: countErr } = await supabase
        .from("artwork_likes")
        .select("id", { count: "exact", head: true })
        .eq("artwork_id", artworkId);
      if (countErr) throw countErr;

      // whether current user liked
      let liked = false;
      if (uid) {
        const { data: likeRow, error: likeErr } = await supabase
          .from("artwork_likes")
          .select("id")
          .eq("artwork_id", artworkId)
          .eq("user_id", uid)
          .single();
        if (likeErr && likeErr.code !== "PGRST116") throw likeErr; // ignore not found
        liked = !!likeRow;
      }
      return { count: count ?? 0, liked };
    },
  });
}

export function useToggleLikeArtwork(artworkId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      // Check if like exists
      const { data: existing, error: checkErr } = await supabase
        .from("artwork_likes")
        .select("id")
        .eq("artwork_id", artworkId)
        .eq("user_id", user.id)
        .single();
      if (checkErr && checkErr.code !== "PGRST116") throw checkErr;

      if (existing) {
        // unlike
        const { error: delErr } = await supabase
          .from("artwork_likes")
          .delete()
          .eq("id", existing.id);
        if (delErr) throw delErr;
      } else {
        // like
        const { error: insErr } = await supabase
          .from("artwork_likes")
          .insert({ artwork_id: artworkId, user_id: user.id });
        if (insErr) throw insErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: likeKey(artworkId) });
    },
  });
}
