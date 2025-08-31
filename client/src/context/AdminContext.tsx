import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Define the user type that matches your auth system
interface User {
  id: string;
  role: string;
  // Add other user properties as needed
}

import { useAuth } from "@/lib/auth";

type AdminContextType = {
  isAdmin: boolean;
  canEdit: boolean;
  canPublish: boolean;
  currentUserId: string | number | null;
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isAdminFlag, setIsAdminFlag] = useState<boolean>(false);

  // fetch flag once the user is available
  useEffect(() => {
    if (!user?.id) { setIsAdminFlag(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        if (!cancelled) setIsAdminFlag(data?.is_admin === true);
      } catch (err) {
        console.warn('is_admin query failed', err);
        if (!cancelled) setIsAdminFlag(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);
  
  // In a real app, you'd check the user's roles/permissions here
  // Determine admin status using the new boolean flag coming either from
  // a direct property (e.g. is_admin) or from user_metadata. Fallback to
  // legacy role string for backward-compatibility.
  const isAdmin =
    isAdminFlag ||
    (user as any)?.is_admin === true ||
    (user as any)?.user_metadata?.is_admin === true ||
    (user as any)?.role === 'admin' ||
    (user as any)?.role === 'staff';
  const canEdit = isAdmin;
  const canPublish = isAdmin;

  return (
    <AdminContext.Provider value={{ 
      isAdmin, 
      canEdit, 
      canPublish, 
      currentUserId: (user?.id as any) || null 
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    // Fallback defaults when component tree is missing AdminProvider – prevents runtime crash
    return {
      isAdmin: false,
      canEdit: false,
      canPublish: false,
      currentUserId: null,
    };
  }
  return context;
}
