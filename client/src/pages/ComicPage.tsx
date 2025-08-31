import { Helmet } from "react-helmet";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import CommentsSection from "@/components/common/CommentsSection";

interface Comic {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  tags: string[];
  created_at: string;
  author_id: string;
}

export default function ComicPage() {
  const [, params] = useRoute("/comics/:id");
  const comicId = params?.id ?? "";

  const {
    data: comic,
    isLoading,
    error,
  } = useQuery<Comic | null>({
    queryKey: ["comic", comicId],
    enabled: !!comicId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comics")
        .select("id, title, description, cover_url, tags, created_at, author_id")
        .eq("id", comicId)
        .single();
      if (error) throw error;
      return data as Comic;
    },
  });

  if (isLoading) return <p className="p-8">Loading…</p>;
  if (error || !comic) return <p className="p-8 text-red-500">Comic not found.</p>;

  return (
    <div className="min-h-screen bg-[#1a1207] text-amber-50 pb-20">
      <Helmet>
        <title>{comic.title} – Comic</title>
      </Helmet>

      <div className="container mx-auto px-4 pt-12 max-w-4xl">
        <div className="flex flex-col md:flex-row gap-8">
          {comic.cover_url && (
            <img
              src={comic.cover_url}
              alt={comic.title}
              className="w-full md:w-72 rounded-lg shadow-lg border border-amber-800"
            />
          )}

          <div className="flex-1 space-y-4">
            <h1 className="font-bangers text-4xl text-amber-400 drop-shadow">
              {comic.title}
            </h1>
            <p className="text-sm text-gray-400">
              Published {formatDistanceToNow(new Date(comic.created_at), { addSuffix: true })}
            </p>
            {comic.description && (
              <p className="leading-relaxed whitespace-pre-wrap text-amber-100">
                {comic.description}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {comic.tags.map((tag) => (
                <span key={tag} className="bg-amber-700 text-xs px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
            <Button asChild className="bg-pink-600 hover:bg-pink-700 text-white">
              <Link href="/tale-craft">
                <a>Read / Continue</a>
              </Link>
            </Button>
          </div>
        </div>

        {/* Comments */}
        <CommentsSection targetId={comicId} targetType="comic" />
      </div>
    </div>
  );
}
