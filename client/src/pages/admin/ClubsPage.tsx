import { Helmet } from "react-helmet";
import { useAdmin } from "@/context/AdminContext";
import { useAdminClubs } from "@/hooks/useAdminClubs";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function ClubsPage() {
  const { isAdmin } = useAdmin();
  const {
    clubs,
    isLoading,
    isError,
    error,
    deleteClub,
  } = useAdminClubs();
  const [search, setSearch] = useState("");

  if (!isAdmin) return <div className="p-8">Access denied</div>;

  const filtered = clubs.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = (id: string) => {
    if (confirm("Delete club?")) deleteClub(id);
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-8 bg-[#15100A] text-amber-50 min-h-screen">
        <Helmet>
          <title>Clubs - Hekayaty Admin</title>
        </Helmet>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold font-cinzel">Clubs</h1>
          <Input placeholder="Search by name" value={search} onChange={(e) => setSearch(e.target.value)} className="w-60" />
        </div>
        <table className="min-w-full text-sm bg-amber-50/10 border border-amber-500">
          <thead>
            <tr className="text-left text-amber-300">
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td className="p-4">Loading...</td></tr>}
            {isError && <tr><td className="p-4 text-red-500">{(error as Error).message}</td></tr>}
            {filtered.map((club) => (
              <tr key={club.id} className="hover:bg-amber-900/50">
                <td className="p-3">{club.name}</td>
                <td className="p-3">{club.category}</td>
                <td className="p-3">
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(club.id)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
