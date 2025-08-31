import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Creator {
  id: string;
  username: string;
  avatar_url: string | null;
  followers_count: number;
}

const creatorsKey = (limit: number | undefined) => ['creators', 'top', limit];

export function useTopCreators(limit: number = 6) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: creatorsKey(limit),
    queryFn: async (): Promise<Creator[]> => {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, avatar_url, followers_count')
        .order('followers_count', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as Creator[];
    },
  });

  return { creators: data ?? [], isLoading, isError, error };
}
