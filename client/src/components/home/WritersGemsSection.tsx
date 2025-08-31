import { Gem, Search } from "lucide-react";
import bgImg from "@/assets/61e25244-e0d4-460d-907d-86223aad6ba0.png";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

// Fetch gem stories
const useGemStories = () =>
  useQuery<any[]>({
    queryKey: ["/api/stories/gems"],
    staleTime: 1000 * 60 * 5,
  });

// removed mock array
/* const gemStories = [
  {
    id: 401,
    title: "The Sapphire Enigma",
    author: "Cassia Bluewind",
    cover: "💎",
  },
  {
    id: 402,
    title: "Emerald Dawn",
    author: "Orion Greenleaf",
    cover: "💚",
  },
  {
    id: 403,
    title: "Ruby Heartbeat",
    author: "Scarlet Ember",
    cover: "❤️",
  },
*/

export default function WritersGemsSection() {
  const [search, setSearch] = useState("");
  const { data: gemStories, isLoading } = useGemStories();
  const filtered = (gemStories || []).filter((s: any) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <section
        className="relative py-16 px-4 bg-center bg-cover"
        style={{ backgroundImage: `url(${bgImg})` }}
      >
        <div className="container mx-auto max-w-6xl grid gap-6 md:grid-cols-3">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="animate-pulse bg-amber-50/10 rounded h-40" />
            ))}
        </div>
      </section>
    );
  }

  if (!filtered.length) {
    return (
      <section
        className="relative py-16 px-4 text-center bg-center bg-cover"
        style={{ backgroundImage: `url(${bgImg})` }}
      >
        <Link href="/gems" className="group">
          <h3 className="font-cinzel text-2xl md:text-3xl text-amber-50 group-hover:text-amber-400 transition-colors">Browse Writer's Gems</h3>
        </Link>
        <p className="font-cormorant italic mt-2 text-amber-200">No gem stories available currently.</p>
        <Link
          href="/publish"
          className="inline-block mt-6 px-6 py-3 bg-amber-400 text-brown-dark font-semibold rounded shadow hover:bg-amber-500 transition-colors"
        >
          Publish your workshop gem
        </Link>
      </section>
    );
  }

  return (
    <section
      className="relative py-16 px-4 text-amber-50 bg-center bg-cover"
      style={{ backgroundImage: `url(${bgImg})` }}
    >
      <div className="absolute inset-0 bg-brown-dark/40" />
      <div className="relative container mx-auto max-w-6xl">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Gem className="h-6 w-6 text-amber-400" />
          <Link href="/gems" className="hover:text-amber-400 transition-colors">
            <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-center">
              Writer's Gems
            </h2>
          </Link>
          <Gem className="h-6 w-6 text-amber-400" />
        </div>
        <div className="text-center mb-8">
          <Link
            href="/publish"
            className="inline-block px-6 py-3 bg-amber-400 text-brown-dark font-semibold rounded shadow hover:bg-amber-500 transition-colors"
          >
            Publish your workshop gem
          </Link>
        </div>
        <div className="relative max-w-md mx-auto mb-10">
          <input
            type="text"
            placeholder="Search winning stories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-3 pl-4 pr-10 rounded-full bg-amber-50/10 placeholder-amber-100 text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-amber-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filtered.map((story) => (
            <Link
              key={story.id}
              href={`/stories/${story.id}`}
              className="story-card bg-amber-50/10 p-6 rounded-lg border border-amber-500 hover:shadow-lg transition-all flex flex-col items-center"
            >
              <div className="text-6xl mb-4">{story.cover}</div>
              <h4 className="font-cinzel text-xl font-bold text-amber-100 mb-1 text-center">
                {story.title}
              </h4>
              <p className="text-amber-200 text-sm text-center">by {story.author}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
