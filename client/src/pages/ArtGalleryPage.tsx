import { useState } from "react";
import { Helmet } from "react-helmet";
import { useGallery, useCreateArtwork } from "@/hooks/useGallery";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useArtworkLike, useToggleLikeArtwork } from "@/hooks/useArtworkLike";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ArtGalleryPage() {
  const { user } = useAuth();
  const { data: artworks = [], isLoading, error } = useGallery();
  const createMutation = useCreateArtwork();

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    await createMutation.mutateAsync({ title, file });
    setTitle("");
    setFile(null);
  };

  return (
    <main className="min-h-screen bg-[#15100A] text-amber-50 p-8">
      <Helmet>
        <title>Art Gallery - NovelNexus</title>
      </Helmet>

      <h1 className="text-4xl font-cinzel mb-8 text-center">Community Art Gallery</h1>

      {user && (
        <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-10 bg-amber-800/20 p-6 rounded space-y-4">
          <h2 className="text-xl font-semibold mb-2">Share Your Artwork</h2>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">Image</Label>
            <Input id="file" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
          </div>
          <Button type="submit" disabled={createMutation.isPending}>Upload</Button>
          {createMutation.isError && <p className="text-red-500">{(createMutation.error as Error).message}</p>}
        </form>
      )}

      {isLoading && <p className="text-center">Loading artworks…</p>}
      {error && <p className="text-center text-red-500">{(error as Error).message}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {artworks.map((art) => {
            const { data: likeData } = useArtworkLike(art.id);
            const toggleMutation = useToggleLikeArtwork(art.id);
            const liked = likeData?.liked ?? false;
            const count = likeData?.count ?? 0;
            return (
          <div key={art.id} className="bg-amber-800/20 p-4 rounded">
            <img src={art.url} alt={art.title} className="w-full h-64 object-cover rounded mb-3" />
            <h3 className="text-lg font-semibold">{art.title}</h3>
            <div className="flex items-center justify-between mt-2">
              <button
                onClick={() => toggleMutation.mutate()}
                className="flex items-center gap-1 text-amber-300 hover:text-amber-400"
              >
                <Heart className={"w-5 h-5 " + (liked ? "fill-current" : "")} />
                <span className="text-sm">{count}</span>
              </button>
            </div>
          </div>
        )})}
      </div>
    </main>
  );
}
