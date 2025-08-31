import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  link?: string | null;
  read: boolean;
  created_at: string;
}

const notificationsKey = (userId: string | undefined) => ['notifications', userId];

export function useNotifications(userId: string | undefined) {
  const qc = useQueryClient();

  // List
  const {
    data = [],
    isLoading,
    isError,
    error,
  } = useQuery<Notification[]>({
    queryKey: notificationsKey(userId),
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Notification[];
    },
    refetchInterval: 10000,
  });

  // Mutations
  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationsKey(userId) }),
  }).mutateAsync;

  const markAllRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId!);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationsKey(userId) }),
  }).mutateAsync;

  return {
    notifications: data,
    isLoading,
    isError,
    error,
    markRead,
    markAllRead,
  };
}
