import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Comment {
  id: string;
  user_id: string;
  username?: string;
  parent_id?: string | null; // replies
  target_id: string; // story_id or comic_id
  target_type: 'story' | 'comic';
  content: string;
  created_at: string;
}

const commentsKey = (targetId: string | undefined, type: 'story' | 'comic' | undefined) => ['comments', type, targetId];

export function useComments(targetId: string | undefined, type: 'story' | 'comic' | undefined) {
  const qc = useQueryClient();

  const {
    data = [],
    isLoading,
    isError,
    error,
  } = useQuery<Comment[]>({
    enabled: !!targetId && !!type,
    queryKey: commentsKey(targetId, type),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('target_id', targetId!)
        .eq('target_type', type!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Comment[];
    },
  });

  const addComment = useMutation({
    mutationFn: async (payload: Omit<Comment, 'id' | 'created_at'>) => {
      const { error } = await supabase.from('comments').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: commentsKey(targetId, type) }),
  }).mutateAsync;

  const deleteComment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('comments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: commentsKey(targetId, type) }),
  }).mutateAsync;

  return { comments: data, isLoading, isError, error, addComment, deleteComment };
}

// Admin moderation list (all comments)
const adminCommentsKey = ['admin', 'comments'];

async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}

export function useAdminComments() {
  const qc = useQueryClient();
  const { data = [], isLoading, isError, error } = useQuery<Comment[]>({
    queryKey: adminCommentsKey,
    queryFn: async () => {
      const token = await getAuthToken();
      const res = await fetch('/api/admin/comments', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch comments');
      return res.json();
    },
    staleTime: 2 * 60 * 1000,
  });

  const deleteComment = useMutation({
    mutationFn: async (id: string) => {
      const token = await getAuthToken();
      const res = await fetch(`/api/admin/comments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete comment');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: adminCommentsKey }),
  }).mutateAsync;

  return { comments: data, isLoading, isError, error, deleteComment };
}
