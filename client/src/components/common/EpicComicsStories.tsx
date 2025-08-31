import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import StoryCard from "@/components/common/StoryCard";
import { Input } from "@/components/ui/input";
import { Search, BookOpen } from "lucide-react";

export default function EpicComicsStories() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: stories, isLoading } = useQuery({
    queryKey: ["/api/comics"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/comics");
      return res.json();
    },
  });

  const filteredStories = stories?.filter((story: any) =>
    story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    story.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    story.author?.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (!stories || stories.length === 0) return null;

  return (
    <div className="mt-16">
      <h3 className="font-bangers text-3xl md:text-4xl text-center mb-8 text-blue-700 dark:text-amber-300">
        Epic Comics Stories
      </h3>
      
      {/* Search */}
      <div className="relative max-w-md mx-auto mb-8">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search comic stories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white/80 border-purple-500/50 focus:border-purple-500"
        />
      </div>

      {/* Stories Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-purple-200 h-48 rounded-t-lg mb-4"></div>
              <div className="bg-purple-200 h-4 rounded mb-2"></div>
              <div className="bg-purple-200 h-3 rounded mb-2"></div>
              <div className="bg-purple-200 h-3 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filteredStories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStories.map((story: any) => (
            <StoryCard key={story.id} story={story} className="bg-white/80 border-purple-500/30" />
          ))}
        </div>
      ) : searchQuery ? (
        <div className="text-center py-8">
          <BookOpen className="h-12 w-12 text-purple-500 mx-auto mb-4" />
          <p className="text-white/90">No comic stories found matching your search</p>
        </div>
      ) : null}
    </div>
  );
}
