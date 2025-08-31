import React from "react";
import { StoriesContext } from "@/context/StoriesContext";
import StoryCreateForm from "@/components/story/StoryCreateForm";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function AdminStoriesPage() {
  const ctx = React.useContext(StoriesContext);
  if (!ctx) return null;
  const { stories, addStory } = ctx;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <h1 className="font-cinzel text-3xl mb-4">Admin Stories Library</h1>

      <StoryCreateForm onCreate={addStory} />

      <h2 className="font-cinzel text-2xl mt-8 mb-3">Existing Stories</h2>
      {stories.length === 0 ? (
        <p className="text-gray-600">No stories yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {stories.map((s) => (
            <div key={s.id} className="border p-2 rounded-md bg-white/70 shadow-sm">
              <img src={s.coverUrl} alt={s.title} className="h-40 w-full object-cover rounded" />
              <h3 className="font-semibold mt-2 line-clamp-1" title={s.title}>{s.title}</h3>
              <p className="text-xs text-gray-700 line-clamp-3 mb-2">{s.description}</p>
              <Button asChild size="sm" className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                <Link href={`/story/${s.id}`}>
                  <a>Open</a>
                </Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
