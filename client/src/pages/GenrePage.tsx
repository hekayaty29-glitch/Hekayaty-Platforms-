import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GENRE_PAGES } from "@shared/schema";

interface PublishedItem {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  authorName: string;
  format: "html" | "pdf";
  projectType: "story" | "comic";
}

export default function GenrePage() {
  const [match, params] = useRoute<{ genre: string }>("/genre/:genre");
  const genre = params?.genre;
  const [items, setItems] = useState<PublishedItem[] | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/genre/${genre}`);
        if (!res.ok) throw new Error("failed");
        const data = await res.json();
        setItems(data.items as PublishedItem[]);
      } catch {
        setItems([]);
      }
    }
    load();
  }, [genre]);

  const title = genre ? GENRE_PAGES[genre as keyof typeof GENRE_PAGES] || genre : "Genre";

  return (
    <div className="max-w-6xl mx-auto py-10 space-y-8">
      <h1 className="text-3xl font-bold text-white">{title}</h1>
      {!items ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl bg-gray-700" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-gray-300">No publications yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card key={item.id} className="bg-gray-800/50 border-gray-700 flex flex-col overflow-hidden">
              {item.coverImage && (
                <img
                  src={item.coverImage}
                  alt={item.title}
                  className="h-40 w-full object-cover"
                />
              )}
              <CardHeader>
                <CardTitle className="text-white text-lg truncate">{item.title}</CardTitle>
                <CardDescription className="text-gray-400 truncate">
                  by {item.authorName}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between p-4 space-y-4">
                <p className="text-gray-300 line-clamp-3 text-sm">{item.description}</p>
                <div className="flex items-center gap-2 mt-auto">
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                    {item.format.toUpperCase()}
                  </Badge>
                  {item.projectType === "comic" && (
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                      Comic
                    </Badge>
                  )}
                  {item.projectType === "story" && (
                    <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300">
                      Story
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
