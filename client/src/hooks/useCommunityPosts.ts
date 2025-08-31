import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getEdgeFunctionUrl, EDGE_FUNCTIONS } from "../lib/api-config";

export interface CommunityPost {
  id: string;
  title: string;
  body: string;
  tags: string[];
  created_at: string;
  user_id: string;
  like_count?: number;
  user_has_liked?: boolean;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  like_count?: number;
  user_has_liked?: boolean;
}

// Get all community posts
export function useCommunityPosts() {
  return useQuery({
    queryKey: ["community", "posts"],
    queryFn: async () => {
      // Get auth token from Supabase
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }
      
      const res = await fetch(getEdgeFunctionUrl(EDGE_FUNCTIONS.COMMUNITY_POSTS), {
        method: 'GET',
        headers
      });
      if (!res.ok) throw new Error("Failed to load posts");
      return res.json();
    },
  });
}

// Create new post
export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { title: string; body: string; tags: string[] }) => {
      // Get auth token from Supabase
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }
      
      const res = await fetch(getEdgeFunctionUrl(EDGE_FUNCTIONS.COMMUNITY_POSTS), {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create post");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", "posts"] });
    },
  });
}

// Like/unlike a post
export function useLikePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      // Get auth token from Supabase
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }
      
      const res = await fetch(getEdgeFunctionUrl(EDGE_FUNCTIONS.COMMUNITY_POSTS), {
        method: "PUT",
        headers,
        body: JSON.stringify({ postId, action: 'like' }),
      });
      if (!res.ok) throw new Error("Failed to toggle like");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", "posts"] });
    },
  });
}

// Get comments for a specific post
export function usePostComments(postId: string) {
  return useQuery({
    queryKey: ["community", "posts", postId, "comments"],
    queryFn: async () => {
      // Get auth token from Supabase
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }
      
      const res = await fetch(getEdgeFunctionUrl(EDGE_FUNCTIONS.COMMUNITY_COMMENTS), {
        method: 'GET',
        headers,
        body: JSON.stringify({ postId })
      });
      if (!res.ok) throw new Error("Failed to load comments");
      return res.json();
    },
    enabled: !!postId,
  });
}

// Add comment to a post
export function useAddComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      // Get auth token from Supabase
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }
      
      const res = await fetch(getEdgeFunctionUrl(EDGE_FUNCTIONS.COMMUNITY_COMMENTS), {
        method: "POST",
        headers,
        body: JSON.stringify({ postId, content }),
      });
      if (!res.ok) throw new Error("Failed to add comment");
      return res.json();
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["community", "posts", postId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["community", "posts"] });
    },
  });
}

// Delete a post
export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(getEdgeFunctionUrl(EDGE_FUNCTIONS.COMMUNITY_POSTS), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      if (!res.ok) throw new Error("Failed to delete post");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", "posts"] });
    },
  });
}

// Delete a comment
export function useDeleteComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, postId }: { commentId: string; postId: string }) => {
      const res = await fetch(getEdgeFunctionUrl(EDGE_FUNCTIONS.COMMUNITY_COMMENTS), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      });
      if (!res.ok) throw new Error("Failed to delete comment");
      return res.json();
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["community", "posts", postId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["community", "posts"] });
    },
  });
}

// Like/unlike a comment
export function useLikeComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, postId }: { commentId: string; postId: string }) => {
      const res = await fetch(getEdgeFunctionUrl(EDGE_FUNCTIONS.COMMUNITY_COMMENTS), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, action: 'like' }),
      });
      if (!res.ok) throw new Error("Failed to toggle comment like");
      return res.json();
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["community", "posts", postId, "comments"] });
    },
  });
}
