import { ReactNode } from "react";
import { useAdmin } from "@/context/AdminContext";

/**
 * Wrap any JSX that should be visible to admins only.
 * If the current user is not an admin, nothing is rendered.
 *
 * Example:
 *   <AdminOnly>
 *     <Button onClick={handleAdd}>Add New</Button>
 *   </AdminOnly>
 */
export default function AdminOnly({ children }: { children: ReactNode }) {
  const { isAdmin } = useAdmin();
  if (!isAdmin) return null;
  return <>{children}</>;
}
