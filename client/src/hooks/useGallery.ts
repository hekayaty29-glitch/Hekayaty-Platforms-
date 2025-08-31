import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export interface Artwork {
  id: string;
  user_id: string;
  title: string;
  url: string;
  created_at: string;
}

const galleryKey = () => ["gallery", "artworks"];

/** Fetch artworks visible to public (approved=true) */
export function useGallery() {
  return useQuery<Artwork[]>({
    queryKey: galleryKey(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artworks")
        .select("id, user_id, title, url, created_at")
        .eq("approved", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Artwork[];
    },
  });
}

/** Admin-only – fetch all artworks regardless of approval */
async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}

export function useAdminArtworks() {
  return useQuery<Artwork[]>({
    queryKey: ["admin", "artworks"],
    queryFn: async () => {
      const token = await getAuthToken();
      const res = await fetch('/api/admin/galleries', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch artworks');
      return res.json();
    },
  });
}

export function useCreateArtwork() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { title: string; file: File }) => {
      if (!user) throw new Error("Not authenticated");
      // Upload to Cloudinary via backend API
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const formData = new FormData();
      formData.append('file', input.file);
      formData.append('folder', 'artworks');

      const resp = await fetch('/api/upload/file', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!resp.ok) throw new Error('Upload failed');
      const json = await resp.json();
      
      const { error: insertErr } = await supabase.from("artworks").insert({ user_id: user.id, title: input.title, url: json.url, approved: false });
      if (insertErr) throw insertErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: galleryKey() });
      queryClient.invalidateQueries({ queryKey: ["admin", "artworks"] });
    },
  });
}

export function useDeleteArtwork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getAuthToken();
      const res = await fetch(`/api/admin/galleries/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete artwork');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "artworks"] }),
  });
}

export function useApproveArtwork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getAuthToken();
      const res = await fetch(`/api/admin/galleries/${id}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to approve artwork');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "artworks"] }),
  });
}
