import { useRoute, Link } from "wouter";
import { useStoryWorld } from "@/hooks/useOriginals";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

interface Character {
  id: number;
  name: string;
  portraitUrl: string;
  description: string;
}

interface StoryWorld {
  id: number;
  title: string;
  posterUrl: string;
  description: string;
  soundtrackUrl: string;
  characters: Character[];
  mapImageUrl: string;
}

export default function OriginalStoryWorldPage() {
  const [, params] = useRoute("/originals/:id");
  const storyId = params ? parseInt(params.id) : 0;
  // Fetch story world from backend
  const { data: fetchedStory } = useStoryWorld(storyId);

  // --- Mock fallback (development/demo) ---
  const mockStory: StoryWorld = {
    id: storyId,
    title: "Chronicles of the Amber Throne",
    posterUrl: "https://images.unsplash.com/photo-1549880338-65ddcdfd017b?auto=format&fit=crop&w=800&q=80",
    description:
      "An exiled princess must reclaim her kingdom with the help of a cursed knight and a rogue alchemist. Explore forbidden realms, forge alliances, and unveil ancient secrets behind the Amber Throne.",
    soundtrackUrl:
      "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Meydan/Havor/Stories_About_the_Wind_Meydan.mp3",
    characters: [
      {
        id: 1,
        name: "Princess Liora",
        portraitUrl:
          "https://images.unsplash.com/photo-1638641791844-a6df6bb5d4e8?auto=format&fit=crop&w=200&q=80",
        description: "Rightful heir to the Amber Throne, wielding light magic.",
      },
      {
        id: 2,
        name: "Sir Edrik",
        portraitUrl:
          "https://images.unsplash.com/photo-1628541126944-992fe8d2dd61?auto=format&fit=crop&w=200&q=80",
        description: "Cursed knight bound to protect Liora until redemption.",
      },
      {
        id: 3,
        name: "Kael the Alchemist",
        portraitUrl:
          "https://images.unsplash.com/photo-1620277224434-2084ebd5410e?auto=format&fit=crop&w=200&q=80",
        description: "Rogue scholar mixing potions and mischief alike.",
      },
    ],
    mapImageUrl:
      "https://images.unsplash.com/photo-1505765050516-f72dcac9c60b?auto=format&fit=crop&w=900&q=80",
  };

  const story = fetchedStory ?? mockStory;

  const [audio] = useState<HTMLAudioElement | null>(() =>
    typeof Audio !== "undefined" ? new Audio(story.soundtrackUrl) : null,
  );
  const [playing, setPlaying] = useState(false);

  const toggleAudio = () => {
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  };

  if (!story) {
    return (
      <div className="flex items-center justify-center h-[70vh] font-cinzel text-xl">
        Loading story…
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 py-10 px-4 lg:px-20 font-cinzel overflow-x-hidden">
      {/* Magical particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-pulse-slow absolute -top-10 left-1/3 h-56 w-56 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="animate-pulse-slow animation-delay-1000 absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-amber-300/40 blur-3xl" />
      </div>

      {/* Poster */}
      <div className="relative mx-auto max-w-3xl shadow-xl rounded-lg overflow-hidden border-4 border-amber-500/60">
        <img src={story.posterUrl} alt={story.title} className="object-cover w-full h-full" />
      </div>

      {/* Description */}
      <div className="relative mt-8 mx-auto max-w-4xl bg-amber-50/80 border border-amber-500/40 rounded-lg p-6 lg:p-10 text-center shadow-lg backdrop-blur-md">
        <p className="text-lg lg:text-xl leading-relaxed text-brown-dark">
          {story.description}
        </p>
      </div>

      {/* Characters */}
      <h2 className="mt-16 mb-6 text-2xl lg:text-3xl text-center text-brown-dark tracking-wide">
        Meet the Characters
      </h2>
      <div className="grid gap-8 grid-cols-[repeat(auto-fit,minmax(180px,1fr))] max-w-6xl mx-auto">
        {story.characters.map((c) => (
          <div
            key={c.id}
            className="group relative flex flex-col items-center text-center bg-amber-50/60 border border-amber-400/30 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <img
              src={c.portraitUrl}
              alt={c.name}
              className="w-28 h-28 object-cover rounded-full border-2 border-amber-500 group-hover:scale-105 transition-transform"
            />
            <h3 className="mt-3 text-lg text-brown-dark font-semibold">{c.name}</h3>
            <p className="mt-1 text-sm text-gray-700 line-clamp-3">{c.description}</p>
          </div>
        ))}
      </div>

      {/* Map */}
      <h2 className="mt-20 mb-6 text-2xl lg:text-3xl text-center text-brown-dark tracking-wide">
        Explore the Realms
      </h2>
      <div className="relative mx-auto max-w-5xl border-4 border-amber-500/50 rounded-lg overflow-hidden shadow-xl">
        <img src={story.mapImageUrl} alt="Story map" className="object-cover w-full" />
      </div>

      {/* Start Journey + Audio */}
      <div className="mt-16 flex flex-col items-center gap-6">
        <Button asChild size="lg" className="px-10 py-4 text-xl font-cinzel animate-pulse-soft bg-amber-600 hover:bg-amber-700 shadow-lg">
          <Link href={`/originals/${storyId}/chapters`}>Start the Journey</Link>
        </Button>

        <button
          onClick={toggleAudio}
          className={cn(
            "relative p-4 rounded-full bg-amber-500 shadow-lg hover:bg-amber-600 transition-colors",
            playing && "animate-ping-soft after:animate-ping-soft" // custom utility may exist
          )}
        >
          {playing ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white" />}
        </button>
      </div>
    </div>
  );
}
