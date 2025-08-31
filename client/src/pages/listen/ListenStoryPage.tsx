import React from "react";
import { useRoute, Link } from "wouter";
import { StoriesContext } from "@/context/StoriesContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ListenStoryPage() {
  const [, params] = useRoute("/listen/:storyId");
  const storyId = params ? parseInt(params.storyId) : 0;
  const ctx = React.useContext(StoriesContext);
  if (!ctx) return <p>Stories not loaded.</p>;
  const story = ctx.stories.find((s) => s.id === storyId);
  if (!story) return <p>Story not found.</p>;

  const chapters = (story as any).chapters || [];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 space-y-6 text-center">
      <h1 className="font-cinzel text-3xl mb-2">{story.title}</h1>
      {story.coverUrl && (
        <img src={story.coverUrl} alt={story.title} className="max-h-72 w-full object-cover rounded-md mx-auto" />
      )}
      {story.soundtrackUrl && (
        <div className="mt-4">
          <iframe
            src={story.soundtrackUrl}
            className="w-full h-40 rounded-md"
            allow="autoplay; encrypted-media"
            title="soundtrack"
          />
        </div>
      )}
      <p className="text-lg text-brown-dark whitespace-pre-wrap">{story.description}</p>

      <h2 className="font-cinzel text-2xl mt-8 mb-4">Chapters</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {chapters.map((c: any) => (
          <Card key={c.id} className="p-4 bg-white/70 border-amber-500/30">
            <h3 className="font-semibold mb-2">{c.title}</h3>
            <Button asChild className="bg-amber-600 hover:bg-amber-700 text-white w-full">
              <Link href={`/listen/${storyId}/${c.id}`}>Listen</Link>
            </Button>
          </Card>
        ))}
      </div>

      <Button asChild variant="outline" className="mt-6">
        <Link href={`/story/${storyId}`}>Back to details</Link>
      </Button>
    </div>
  );
}
