import React from "react";
import { useRoute, Link } from "wouter";
import { StoriesContext } from "@/context/StoriesContext";
import ScenePlayer from "@/components/listen/ScenePlayer";
import { Button } from "@/components/ui/button";

export default function ListenChapterPage() {
  const [, params] = useRoute("/listen/:storyId/:chapterId");
  const storyId = params ? parseInt(params.storyId) : 0;
  const chapterId = params ? parseInt(params.chapterId) : 0;
  const ctx = React.useContext(StoriesContext);
  if (!ctx) return <p>Stories not loaded</p>;
  const story = ctx.stories.find((s) => s.id === storyId);
  if (!story) return <p>Story not found.</p>;
  const chapter = (story as any).chapters?.find((c: any) => c.id === chapterId);
  if (!chapter) return <p>Chapter not found.</p>;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6 space-y-6">
      <h1 className="font-cinzel text-2xl text-center mb-4">{story.title} – {chapter.title}</h1>
      <ScenePlayer scenes={chapter.scenes} />
      <div className="flex justify-between mt-6">
        <Button asChild variant="outline">
          <Link href={`/listen/${storyId}`}>
            <a>Back to story</a>
          </Link>
        </Button>
      </div>
    </div>
  );
}
