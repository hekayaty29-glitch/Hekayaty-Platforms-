import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface SubscriptionCode {
  id: string;
  code: string;
  months: number;
  used: boolean;
  expires_at: string | null;
  created_at: string;
}

const codesKey = ['admin', 'subscription-codes'];

function generateCode(len = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let res = '';
  for (let i = 0; i < len; i++) {
    res += chars[Math.floor(Math.random() * chars.length)];
  }
  return res;
}

export function useAdminSubscriptionCodes() {
  const qc = useQueryClient();

  const list = useQuery<SubscriptionCode[]>({
    queryKey: codesKey,
    queryFn: async () => {
      const { data, error } = await supabase.from('subscription_codes').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as SubscriptionCode[];
    },
    staleTime: 60 * 1000,
  });

  const createCodes = useMutation({
    mutationFn: async ({ count, months }: { count: number; months: number }) => {
      const rows = Array.from({ length: count }, () => ({ code: generateCode(10), months }));
      const { error } = await supabase.from('subscription_codes').insert(rows);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: codesKey }),
  });

  return { ...list, createCodes };
}
