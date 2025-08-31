import { useRoute, Link } from "wouter";
import { useStoryChapters } from "@/hooks/useStoryChapters";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface Chapter {
  id: number;
  title: string;
  summary: string;
  coverUrl: string;
  unlocked: boolean;
}

export default function OriginalChaptersPage() {
  const [, params] = useRoute("/originals/:id/chapters");
  const storyId = params ? parseInt(params.id) : 0;
  const { data: fetchedChapters } = useStoryChapters(storyId);

  const mockChapters: Chapter[] = [
    {
      id: 1,
      title: "Chapter 1: Exile",
      summary: "Princess Liora flees the palace after a bloody coup.",
      coverUrl: "https://images.unsplash.com/photo-1500634241929-665175962b00?auto=format&fit=crop&w=400&q=80",
      unlocked: true,
    },
    {
      id: 2,
      title: "Chapter 2: The Cursed Knight",
      summary: "Liora encounters Sir Edrik in the Haunted Forest.",
      coverUrl: "https://images.unsplash.com/photo-1618336997788-918bf8692e90?auto=format&fit=crop&w=400&q=80",
      unlocked: true,
    },
    {
      id: 3,
      title: "Chapter 3: Alchemist's Gambit",
      summary: "Kael brews a potion that could tip the scales.",
      coverUrl: "https://images.unsplash.com/photo-1607082349567-1766555a555d?auto=format&fit=crop&w=400&q=80",
      unlocked: false,
    },
  ];

  const chapters = fetchedChapters ?? mockChapters;

  if (!chapters) return <div className="h-[70vh] flex items-center justify-center font-cinzel">Loading chapters…</div>;

  return (
    <div className="min-h-screen bg-amber-50/60 py-12 px-4 lg:px-20 font-cinzel">
      <h1 className="text-3xl lg:text-4xl text-center text-brown-dark mb-10">Choose a Chapter</h1>
      <div className="grid gap-8 grid-cols-[repeat(auto-fit,minmax(240px,1fr))] max-w-6xl mx-auto">
        {chapters.map((ch) => (
          <Card key={ch.id} className="overflow-hidden border-amber-400/40 bg-amber-100/50 shadow-md">
            <img src={ch.coverUrl} alt={ch.title} className="h-40 w-full object-cover" />
            <CardContent className="p-4 flex flex-col flex-grow">
              <h2 className="text-xl text-brown-dark mb-2">{ch.title}</h2>
              <p className="text-sm text-gray-700 flex-grow line-clamp-3">{ch.summary}</p>
              <Button
                asChild
                disabled={!ch.unlocked}
                className="mt-4 self-start bg-amber-600 hover:bg-amber-700"
              >
                <Link href={`/originals/${storyId}/chapters/${ch.id}/pages/1`}>
                  <span className="flex items-center gap-1">{ch.unlocked ? "Start" : "Locked"} <ChevronRight className="w-4 h-4"/></span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
