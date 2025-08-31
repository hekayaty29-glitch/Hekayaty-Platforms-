import { useAuth } from "@/lib/auth";
import { Helmet } from "react-helmet";
import { Redirect, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Check, Pencil, Trash2, UploadCloud } from "lucide-react";

interface WorkItemBase {
  id: number;
  title: string;
  isPublished: boolean;
  createdAt: string;
  averageRating?: number; // only populated for stories
}

interface Story extends WorkItemBase {
  type: "story";
  averageRating?: number;
}

interface Comic extends WorkItemBase {
  type: "comic";
}

type WorkItem = Story | Comic;

export default function WorkspacePage() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  if (!isAuthenticated || !user) {
    return <Redirect to="/login" />;
  }

  const fetchMyStories = async (): Promise<Story[]> => {
    const { getEdgeFunctionUrl, EDGE_FUNCTIONS } = await import('../lib/api-config');
    const res = await fetch(`${getEdgeFunctionUrl(EDGE_FUNCTIONS.STORIES_READ)}?authorId=${user.id}&includeDrafts=true`);
    if (!res.ok) throw new Error("Failed to fetch stories");
    const stories = await res.json();
    return stories.map((s: any) => ({ ...s, type: "story" }));
  };

  const fetchMyComics = async (): Promise<Comic[]> => {
    const res = await fetch(`/api/comics?authorId=${user.id}&includeDrafts=true`);
    if (!res.ok) throw new Error("Failed to fetch comics");
    const comics = await res.json();
    return comics.map((c: any) => ({ ...c, type: "comic" }));
  };

  const { data: stories, isLoading: loadingStories } = useQuery({
    queryKey: ["my-stories"],
    queryFn: fetchMyStories,
  });

  const { data: comics, isLoading: loadingComics } = useQuery({
    queryKey: ["my-comics"],
    queryFn: fetchMyComics,
  });

  const isLoading = loadingStories || loadingComics;

  const publishMutation = useMutation({
    mutationFn: async (id: number) => {
      const { getEdgeFunctionUrl, EDGE_FUNCTIONS } = await import('../lib/api-config');
      const res = await fetch(getEdgeFunctionUrl(EDGE_FUNCTIONS.STORIES_PUBLISH), { 
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId: id })
      });
      if (!res.ok) throw new Error("Publish failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-stories"] }),
  });

  const unpublishMutation = useMutation({
    mutationFn: async (id: number) => {
      const { getEdgeFunctionUrl, EDGE_FUNCTIONS } = await import('../lib/api-config');
      const res = await fetch(getEdgeFunctionUrl(EDGE_FUNCTIONS.STORIES_UPDATE), { 
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId: id, is_published: false })
      });
      if (!res.ok) throw new Error("Unpublish failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-stories"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { getEdgeFunctionUrl, EDGE_FUNCTIONS } = await import('../lib/api-config');
      const res = await fetch(getEdgeFunctionUrl(EDGE_FUNCTIONS.STORIES_UPDATE), { 
        method: "DELETE",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId: id })
      });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-stories"] }),
  });

  const allItems: WorkItem[] = [...(stories || []), ...(comics || [])];
  const drafts = allItems.filter((w) => !w.isPublished);
  const published = allItems.filter((w) => w.isPublished);

  return (
    <div className="min-h-screen bg-[#15100A] text-amber-50 py-12 px-4">
      <Helmet>
        <title>My Workspace - Hekayaty</title>
      </Helmet>

      <div className="container mx-auto max-w-5xl space-y-12">
        <div className="flex items-center justify-between">
          <h1 className="font-cinzel text-3xl md:text-4xl font-bold">My Workspace</h1>
          <Button asChild className="bg-amber-500 hover:bg-amber-600 text-brown-dark font-cinzel">
            <Link href="/publish">New Story</Link>
          </Button>
        </div>

        {/* Drafts */}
        <section>
          <h2 className="font-cinzel text-2xl mb-4">Drafts</h2>
          {isLoading ? (
            <p>Loading…</p>
          ) : drafts.length === 0 ? (
            <p className="text-amber-200">No drafts yet.</p>
          ) : (
            <ul className="space-y-4">
              {drafts.map((story) => (
                <li key={story.id} className="bg-amber-50/10 p-4 rounded-lg flex justify-between items-center">
                  <span>{story.title}</span>
                  <div className="flex gap-2">
                    <Button size="icon" variant="outline" asChild>
                      {story.type === "story" ? (
                          <Link href={`/publish?edit=${story.id}`}><Pencil className="h-4 w-4" /></Link>
                        ) : (
                          <Link href={`/talecraft/comic/${story.id}`}><Pencil className="h-4 w-4" /></Link>
                        )}
                    </Button>
                    <Button size="icon" variant="outline" onClick={() => publishMutation.mutate(story.id)}>
                      <UploadCloud className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="destructive" onClick={() => deleteMutation.mutate(story.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Published */}
        <section>
          <h2 className="font-cinzel text-2xl mb-4">Published</h2>
          {isLoading ? (
            <p>Loading…</p>
          ) : published.length === 0 ? (
            <p className="text-amber-200">No published stories yet.</p>
          ) : (
            <ul className="space-y-4">
              {published.map((story) => (
                <li key={story.id} className="bg-amber-50/10 p-4 rounded-lg flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span>{story.title}</span>
                    {story.averageRating && (
                      <span className="text-sm text-amber-400 font-medium flex items-center gap-1"><Check className="h-3 w-3" />{story.averageRating.toFixed(1)}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="outline" asChild>
                      {story.type === "story" ? (
                          <Link href={`/story/${story.id}`}><Pencil className="h-4 w-4" /></Link>
                        ) : (
                          <Link href={`/comic/${story.id}`}><Pencil className="h-4 w-4" /></Link>
                        )}
                    </Button>
                    <Button size="icon" variant="outline" onClick={() => unpublishMutation.mutate(story.id)}>
                      <UploadCloud className="h-4 w-4 rotate-180" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
