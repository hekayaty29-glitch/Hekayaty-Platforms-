import React from "react";
import { Button } from "@/components/ui/button";

export interface NewStory {
  id: number;
  title: string;
  description: string;
  coverUrl: string;
  posterUrl?: string;
  soundtrackUrl?: string;
  extraPhotos: string[];
  genres: string[];
  tags?: string[];
}

interface StoryCreateFormProps {
  onCreate: (story: NewStory) => void;
}

export default function StoryCreateForm({ onCreate }: StoryCreateFormProps) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [cover, setCover] = React.useState("");
  const [poster, setPoster] = React.useState("");
  const [soundtrack, setSoundtrack] = React.useState("");
  const [extra, setExtra] = React.useState<string>("");
  const [genres, setGenres] = React.useState<string>("");
  const [tags, setTags] = React.useState<string>("");

  return (
    <div className="space-y-3 bg-white/70 p-4 rounded-md border border-amber-500/50">
      <h2 className="font-cinzel text-xl mb-2">Add New Story / Novel</h2>

      <input
        className="w-full bg-white/90 border px-3 py-2 rounded-md"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="w-full bg-white/90 border px-3 py-2 rounded-md"
        placeholder="Description / Synopsis"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <input
        className="w-full bg-white/90 border px-3 py-2 rounded-md"
        placeholder="Cover Image URL"
        value={cover}
        onChange={(e) => setCover(e.target.value)}
      />
      {cover && (
        <img src={cover} alt="cover preview" className="h-40 object-cover rounded" />
      )}
      <input
        className="w-full bg-white/90 border px-3 py-2 rounded-md"
        placeholder="Poster Image URL (optional)"
        value={poster}
        onChange={(e) => setPoster(e.target.value)}
      />
      <input
        className="w-full bg-white/90 border px-3 py-2 rounded-md"
        placeholder="Soundtrack URL (optional)"
        value={soundtrack}
        onChange={(e) => setSoundtrack(e.target.value)}
      />
      <input
        className="w-full bg-white/90 border px-3 py-2 rounded-md"
        placeholder="Genres (comma separated e.g. Fantasy,Romance)"
        value={genres}
        onChange={(e) => setGenres(e.target.value)}
      />
      <input
        className="w-full bg-white/90 border px-3 py-2 rounded-md"
        placeholder="Tags (optional, comma separated)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />
      <input
        className="w-full bg-white/90 border px-3 py-2 rounded-md"
        placeholder="Extra Photo URLs (comma separated)"
        value={extra}
        onChange={(e) => setExtra(e.target.value)}
      />

      <Button
        className="bg-amber-600 hover:bg-amber-700 text-white mt-2"
        onClick={() => {
          if (!title || !description || !cover) return;
          const story: NewStory = {
            id: Date.now(),
            title,
            description,
            coverUrl: cover,
            posterUrl: poster || undefined,
            soundtrackUrl: soundtrack || undefined,
            extraPhotos: extra
              .split(",")
              .map((u) => u.trim())
              .filter((u) => u.length > 0),
            genres: genres.split(",").map((g) => g.trim()).filter((g) => g.length > 0),
            tags: tags
              .split(",")
              .map((t) => t.trim())
              .filter((t) => t.length > 0),
          };
          onCreate(story);
          // reset
          setTitle("");
          setDescription("");
          setCover("");
          setPoster("");
          setSoundtrack("");
          setExtra("");
          setGenres("");
          setTags("");
        }}
      >
        Save Story
      </Button>
    </div>
  );
}
