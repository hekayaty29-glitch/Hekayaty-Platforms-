import { useAuth } from "@/lib/auth";

/**
 * Simple helper hook that classifies the current user role.
 *
 * VIP = `user.isPremium === true`
 * ADMIN = `user.isAdmin === true`
 * FREE  = fallback when neither of the above is true OR unauthenticated.
 */
export function useRoles() {
  const { user, isAuthenticated } = useAuth();

  const isAdmin = Boolean(user?.isAdmin);
  const isVip = Boolean(user?.isPremium && !isAdmin); // admin implies all vip perks
  const isFree = !isVip && !isAdmin;

  return { isAuthenticated, isAdmin, isVip, isFree } as const;
}
