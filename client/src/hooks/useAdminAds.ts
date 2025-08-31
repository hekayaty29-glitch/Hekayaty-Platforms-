import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Ad {
  id: string;
  title: string;
  image_url: string;
  target_url: string;
  placement: string;
  active: boolean;
  created_at: string;
}

const adminAdsKey = ["admin", "ads"];

async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}

export function useAdminAds() {
  const qc = useQueryClient();

  // List ads
  const listQuery = useQuery<Ad[]>({
    queryKey: adminAdsKey,
    queryFn: async () => {
      const token = await getAuthToken();
      const res = await fetch("/api/admin/ads", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch ads");
      return res.json();
    },
    staleTime: 2 * 60 * 1000,
  });

  // Create ad
  const createMutation = useMutation({
    mutationFn: async (payload: Omit<Ad, "id" | "created_at">) => {
      const token = await getAuthToken();
      const res = await fetch("/api/admin/ads", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create ad");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: adminAdsKey }),
  });

  // Update ad
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Omit<Ad, "id" | "created_at">> }) => {
      const token = await getAuthToken();
      const res = await fetch(`/api/admin/ads/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update ad");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: adminAdsKey }),
  });

  // Delete ad
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getAuthToken();
      const res = await fetch(`/api/admin/ads/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete ad");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: adminAdsKey }),
  });

  return {
    ads: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    error: listQuery.error as Error | undefined,
    createAd: createMutation.mutateAsync,
    updateAd: updateMutation.mutateAsync,
    deleteAd: deleteMutation.mutateAsync,
  };
}
