import { Star, Search } from "lucide-react";
import bgImg from "@/assets/00a75467-b343-4cf1-a5c7-0b7d1270efc4.png";
import { Link } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface Story {
  id: number;
  title: string;
  author: string;
  cover: string;
  genre: string;
  category: "top" | "collection";
}

// Fetch special stories
const useSpecialStories = () =>
  useQuery<Story[]>({
    queryKey: ["/api/stories/special"],
    staleTime: 1000 * 60 * 5,
  });

export default function SpecialStories() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");

  const { data, isLoading } = useSpecialStories();

  const genres = Array.from(new Set((data || []).map((s) => s.genre)));

  const filtered = (data || []).filter((s) => {
    const matchGenre = selectedGenre === "all" || s.genre === selectedGenre;
    const matchTitle = s.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchGenre && matchTitle;
  });

  const topRated = filtered.filter((s) => s.category === "top");
  const bestCollections = filtered.filter((s) => s.category === "collection");

  if (isLoading) {
    return (
      <section
        className="relative py-16 px-4 bg-center bg-cover"
        style={{ backgroundImage: `url(${bgImg})` }}
        id="special-stories"
      >
        <div className="container mx-auto max-w-6xl grid gap-6 md:grid-cols-3">
          {Array(3).fill(0).map((_, i) => (
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
        id="special-stories"
      >
        <Link href="/special" className="group">
          <h3 className="font-cinzel text-2xl md:text-3xl text-amber-50 group-hover:text-amber-400 transition-colors">Browse Special Stories</h3>
        </Link>
        <p className="font-cormorant italic mt-2 text-amber-200">No special stories available right now.</p>
      </section>
    );
  }

  return (
    <section
      className="relative py-16 px-4 text-amber-50 bg-center bg-cover"
      style={{ backgroundImage: `url(${bgImg})` }}
    >
      <div className="absolute inset-0 bg-brown-dark/25" />
      <div className="relative container mx-auto max-w-6xl">
        <Link href="/special#top" className="block">
          <h3 className="font-cinzel text-3xl md:text-4xl mb-6 text-center text-amber-200 hover:text-amber-400 transition-colors">
            Top Rated
          </h3>
        </Link>
        {/* Search */}
        <div className="flex flex-col md:flex-row items-center gap-4 mb-12">
          <div className="relative w-full md:w-2/3">
            <input
              type="text"
              placeholder="Search by story title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-3 pl-4 pr-10 rounded-full bg-amber-50/10 placeholder-amber-100 text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-amber-400" />
          </div>

          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="py-3 px-4 rounded-full bg-amber-50/10 text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Genres</option>
            {genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {topRated.map((story) => (
            <Link
              key={story.id}
              href={`/stories/${story.id}`}
              className="story-card bg-amber-50/10 p-6 rounded-lg border border-amber-500 hover:shadow-lg transition-all flex flex-col items-center"
            >
              <div className="text-6xl mb-4">{story.cover}</div>
              <h4 className="font-cinzel text-xl font-bold text-amber-100 mb-1 text-center">
                {story.title}
              </h4>
              <p className="text-amber-200 text-sm">by {story.author}</p>
            </Link>
          ))}
        </div>

        {/* Collections */}
        <h3 className="font-cinzel text-2xl mb-6 text-center text-amber-200">Best Collections</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {bestCollections.map((story) => (
            <Link
              key={story.id}
              href={`/stories/${story.id}`}
              className="story-card bg-amber-50/10 p-6 rounded-lg border border-amber-500 hover:shadow-lg transition-all flex flex-col items-center"
            >
              <div className="text-6xl mb-4">{story.cover}</div>
              <h4 className="font-cinzel text-xl font-bold text-amber-100 mb-1 text-center">
                {story.title}
              </h4>
              <p className="text-amber-200 text-sm">{story.author}</p>
            </Link>
          ))}
        </div>
        <div className="text-center mt-12">
          <Link
            href="/talecraft"
            className="inline-block bg-amber-500 hover:bg-amber-600 text-amber-50 font-cinzel py-3 px-8 rounded-full transition-colors"
          >
            Explore TaleCraft Stories
          </Link>
        </div>
      </div>
    </section>
  );
}
