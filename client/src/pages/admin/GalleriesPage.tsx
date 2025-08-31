import { Helmet } from "react-helmet";
import { useAdmin } from "@/context/AdminContext";
import { useAdminArtworks, useDeleteArtwork, useApproveArtwork } from "@/hooks/useGallery";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";

export default function GalleriesPage() {
  const { isAdmin } = useAdmin();
  const { data: artworks = [], isLoading, error } = useAdminArtworks();
  const deleteMutation = useDeleteArtwork();
  const approveMutation = useApproveArtwork();

  if (!isAdmin) return <div className="p-8">Access denied</div>;

  if (isLoading) return <div className="p-8">Loading…</div>;
  if (error) return <div className="p-8 text-red-500">{(error as Error).message}</div>;

  const handleDelete = (id: string) => {
    if (confirm("Delete artwork?")) deleteMutation.mutate(id);
  };
  const handleApprove = (id: string) => approveMutation.mutate(id);

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-8 bg-[#15100A] text-amber-50 min-h-screen">
        <Helmet>
          <title>Art Galleries - Hekayaty Admin</title>
        </Helmet>
        <h1 className="text-3xl font-bold font-cinzel mb-6">Art Galleries</h1>
        {artworks.length === 0 && <p>No artworks yet.</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {artworks.map((art) => (
            <div key={art.id} className="bg-amber-800/20 p-4 rounded">
              <img src={art.url} alt={art.title} className="w-full h-48 object-cover rounded mb-3" />
              <div className="flex justify-between items-center">
                <span>{art.title}</span>
                <div className="space-x-2">
                  {!('approved' in art && (art as any).approved) && (
                    <Button size="sm" onClick={() => handleApprove(art.id)} disabled={approveMutation.isPending}>Approve</Button>
                  )}
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(art.id)} disabled={deleteMutation.isPending}>
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
