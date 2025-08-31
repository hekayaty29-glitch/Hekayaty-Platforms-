import { useState } from "react";
import { Helmet } from "react-helmet";
import { useAdmin } from "@/context/AdminContext";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAdminAds, Ad } from "@/hooks/useAdminAds";

export default function AdsPage() {
  const { isAdmin } = useAdmin();
  const { ads, isLoading, error, createAd, updateAd, deleteAd } = useAdminAds();

  const [form, setForm] = useState<Omit<Ad, "id" | "created_at">>({
    title: "",
    image_url: "",
    target_url: "",
    placement: "home_top",
    active: true,
  });

  if (!isAdmin) return <div className="p-8">Access denied</div>;
  if (isLoading) return <div className="p-8">Loading ads…</div>;
  if (error) return <div className="p-8 text-red-500">{error.message}</div>;

  const handleSubmit = async () => {
    await createAd(form);
    setForm({ ...form, title: "", image_url: "", target_url: "" });
  };

  const toggleActive = (ad: Ad) => updateAd({ id: ad.id, data: { active: !ad.active } });

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-8 bg-[#15100A] text-amber-50 min-h-screen">
        <Helmet>
          <title>Sponsored Ads - Admin</title>
        </Helmet>
        <h1 className="text-3xl font-bold font-cinzel mb-6">Sponsored Ads</h1>

        {/* create form */}
        <div className="mb-8 space-y-3 bg-amber-800/20 p-4 rounded border border-amber-500 w-full max-w-xl">
          <h2 className="font-semibold text-lg">Create New Ad</h2>
          <Input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Input
            placeholder="Image URL"
            value={form.image_url}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
          />
          <Input
            placeholder="Target URL"
            value={form.target_url}
            onChange={(e) => setForm({ ...form, target_url: e.target.value })}
          />
          <Input
            placeholder="Placement (e.g., home_top)"
            value={form.placement}
            onChange={(e) => setForm({ ...form, placement: e.target.value })}
          />
          <div className="flex items-center gap-2">
            <Checkbox
              id="active"
              checked={form.active}
              onCheckedChange={(val) => setForm({ ...form, active: Boolean(val) })}
            />
            <label htmlFor="active">Active</label>
          </div>
          <Button onClick={handleSubmit}>Create Ad</Button>
        </div>

        {/* list */}
        <table className="min-w-full text-sm bg-amber-50/10 border border-amber-500">
          <thead>
            <tr className="text-left text-amber-300">
              <th className="p-3">Title</th>
              <th className="p-3">Image</th>
              <th className="p-3">Target</th>
              <th className="p-3">Placement</th>
              <th className="p-3">Active</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ads.map((ad) => (
              <tr key={ad.id} className="hover:bg-amber-900/50">
                <td className="p-3 font-medium">{ad.title}</td>
                <td className="p-3">
                  <img src={ad.image_url} alt="ad" className="h-10" />
                </td>
                <td className="p-3 max-w-xs truncate">{ad.target_url}</td>
                <td className="p-3">{ad.placement}</td>
                <td className="p-3">
                  <Checkbox checked={ad.active} onCheckedChange={() => toggleActive(ad)} />
                </td>
                <td className="p-3">
                  <Button size="sm" variant="destructive" onClick={() => deleteAd(ad.id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
