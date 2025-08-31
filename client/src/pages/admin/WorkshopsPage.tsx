import { Helmet } from "react-helmet";
import { useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { useAdminWorkshops, Workshop } from "@/hooks/useAdminWorkshops";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarDays, Plus } from "lucide-react";

export default function WorkshopsPage() {
  const { isAdmin } = useAdmin();
  const {
    workshops,
    isLoading,
    isError,
    error,
    addWorkshop,
    deleteWorkshop,
  } = useAdminWorkshops();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", date: "" });

  if (!isAdmin) return <div className="p-8">Access denied</div>;

  const handleDelete = (id: string) => {
    if (confirm("Delete workshop?")) deleteWorkshop(id);
  };

  const saveWorkshop = () => {
    if (!form.title) return alert("Title required");
    addWorkshop({ title: form.title, description: form.description, date: form.date });
    setForm({ title: "", description: "", date: "" });
    setShowForm(false);
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-8 bg-[#15100A] text-amber-50 min-h-screen">
        <Helmet>
          <title>Workshops - Hekayaty Admin</title>
        </Helmet>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold font-cinzel">Workshops</h1>
          <Button onClick={() => setShowForm((s) => !s)}>
            <Plus className="h-4 w-4 mr-2" /> New Workshop
          </Button>
        </div>
        {showForm && (
          <div className="bg-amber-800/30 p-4 rounded mb-6 max-w-xl space-y-3">
            <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <Button onClick={saveWorkshop}>Save</Button>
          </div>
        )}
        <table className="min-w-full text-sm bg-amber-50/10 border border-amber-500">
          <thead>
            <tr className="text-left text-amber-300">
              <th className="p-3">Title</th>
              <th className="p-3">Date</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td className="p-4">Loading...</td></tr>}
            {isError && <tr><td className="p-4 text-red-500">{(error as Error).message}</td></tr>}
            {workshops.map((w) => (
              <tr key={w.id} className="hover:bg-amber-900/50">
                <td className="p-3">{w.title}</td>
                <td className="p-3">{w.date}</td>
                <td className="p-3">
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(w.id)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
