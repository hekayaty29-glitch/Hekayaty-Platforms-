import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface PaymentLog {
  id: string;
  user_id: string;
  username?: string;
  method: string; // paypal, vodafone, fawry
  amount: number; // cents
  currency: string;
  status: 'success' | 'failed' | 'pending';
  created_at: string;
}

const paymentsKey = ['admin', 'payments'];

export function useAdminPayments() {
  return useQuery<PaymentLog[]>({
    queryKey: paymentsKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*, users(username)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PaymentLog[];
    },
    staleTime: 60 * 1000,
  });
}
