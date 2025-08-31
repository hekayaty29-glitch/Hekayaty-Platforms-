import { Helmet } from "react-helmet";
import { useAdmin } from "@/context/AdminContext";
import { useAdminAPI } from "@/context/AdminAPIContext";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function UsersPage() {
  const { isAdmin } = useAdmin();
  const { users, banUser } = useAdminAPI();
  const [banReason, setBanReason] = useState<string>("");

  if (!isAdmin) {
    return <div className="p-8">Access denied</div>;
  }

  const handleToggleBan = async (userId: string, currentlyBanned: boolean) => {
    try {
      const reason = !currentlyBanned ? banReason || "Violation of terms" : undefined;
      await banUser(userId, !currentlyBanned, reason);
      setBanReason("");
    } catch (error) {
      console.error('Failed to update ban status:', error);
    }
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-8 bg-[#15100A] text-amber-50 min-h-screen">
        <Helmet>
          <title>User Management - Hekayaty Admin</title>
        </Helmet>
        <h1 className="text-3xl font-bold font-cinzel mb-6">User Management</h1>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm bg-amber-50/10 border border-amber-500">
            <thead>
              <tr className="text-left text-amber-300">
                <th className="p-3">ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.data?.map((u) => (
                <tr key={u.id} className="hover:bg-amber-900/50">
                  <td className="p-3 text-amber-300 underline cursor-pointer"><a href={`/admin/users/${u.id}`}>{u.id}</a></td>
                  <td className="p-3">{u.full_name}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{u.is_banned ? "Banned" : "Active"}</td>
                  <td className="p-3">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleToggleBan(u.id, u.is_banned)}
                      disabled={users.isLoading}
                    >
                      {u.is_banned ? "Unban" : "Ban"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
