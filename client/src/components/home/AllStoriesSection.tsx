import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Search, BookOpen } from "lucide-react";
import StoryCard from "@/components/common/StoryCard";
import { StoryCard as StoryCardType } from "@/lib/types";
import bgImg from "@/assets/d2c8245c-c591-4cc9-84d2-27252be8dffb.png";

export default function AllStoriesSection() {
  const { data: stories, isLoading, error } = useQuery<StoryCardType[]>({
    queryKey: ["/api/stories"],
    queryFn: async () => {
      const { getEdgeFunctionUrl, EDGE_FUNCTIONS } = await import('../../lib/api-config');
      const url = getEdgeFunctionUrl(EDGE_FUNCTIONS.STORIES_LIST);
      console.log('Fetching stories from:', url);
      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Response status:', res.status, res.statusText);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error:', errorText);
        throw new Error(`Failed to fetch stories: ${res.status} ${errorText}`);
      }
      const data = await res.json();
      console.log('Stories data:', data);
      return data.stories || [];
    }
  });

  const [query, setQuery] = useState("");
  const filtered = (stories ?? []).filter((s) =>
    s.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <section
      className="relative py-16 px-4 text-amber-50 bg-center bg-cover"
      style={{ backgroundImage: `url(${bgImg})` }}
    >
      <div className="absolute inset-0 bg-brown-dark/40" />
      <div className="relative container mx-auto max-w-6xl">
        {/* Heading */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <BookOpen className="h-6 w-6 text-amber-400" />
          <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-center">
            Browse All Stories
          </h2>
          <BookOpen className="h-6 w-6 text-amber-400" />
        </div>

        {/* Search */}
        <div className="relative max-w-md mx-auto mb-10">
          <input
            type="text"
            placeholder="Search stories..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full py-3 pl-4 pr-10 rounded-full bg-amber-50/10 placeholder-amber-100 text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-amber-400" />
        </div>

        {/* Grid */}
        {isLoading ? (
          <p className="text-center">Loading stories...</p>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">
              <p>Error loading stories: {error.message}</p>
            </div>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-amber-200 h-48 rounded-t-lg mb-4"></div>
                <div className="bg-amber-200 h-4 rounded mb-2"></div>
                <div className="bg-amber-200 h-3 rounded mb-2"></div>
                <div className="bg-amber-200 h-3 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filtered.slice(0, 6).map((story) => (
              <StoryCard key={story.id} story={{
                ...story, 
                id: story.id.toString(),
                ratingCount: story.ratingCount || 0,
                author: story.author ? {
                  ...story.author,
                  id: story.author.id.toString()
                } : { id: '', fullName: 'Unknown Author', avatarUrl: '' }
              }} />
            ))}
          </div>
        ) : (
          <p className="text-center">No stories found.</p>
        )}
        {/* Link to full browse page */}
        <div className="text-center mt-10">
          <Link
            href="/stories"
            className="inline-block bg-amber-500 hover:bg-amber-600 text-amber-50 font-cinzel py-2 px-6 rounded-full transition-colors"
          >
            View All Stories
          </Link>
        </div>
      </div>
    </section>
  );
}
