import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { apiRequest } from "@/lib/queryClient";
import StoryCard from "@/components/common/StoryCard";
import { Input } from "@/components/ui/input";
import { Search, BookOpen } from "lucide-react";
import fantasyBackground from "@/assets/afe886e1-be42-446e-8d67-2019ebe6c8fd_13-58-27.png";

export default function HekayatyOriginalStoriesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: stories, isLoading } = useQuery({
    queryKey: ["/api/stories", { placement: "Hekayaty Originals" }],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/stories?placement=" + encodeURIComponent("Hekayaty Originals"));
      return res.json();
    },
  });

  const filteredStories = stories?.filter((story: any) =>
    story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    story.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    story.author?.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <>
      <Helmet>
        <title>Hekayaty Original Stories</title>
        <meta
          name="description"
          content="Explore exclusive Hekayaty Original stories crafted by our community's finest authors."
        />
      </Helmet>

      <div
          className="bg-cover bg-center bg-fixed bg-gradient-to-b from-purple-900/40 to-amber-900/30 min-h-screen pt-8 pb-16"
          style={{ backgroundImage: `url(${fantasyBackground})` }}
        >
        <div className="container mx-auto max-w-6xl px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-cinzel text-4xl font-bold text-white mb-4">
              Hekayaty Original Stories
            </h1>
            <p className="text-white max-w-2xl mx-auto mb-6">
              Explore exclusive stories crafted by our community's finest authors
            </p>
            
            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search stories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-amber-500/50 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Stories Grid */}
          {isLoading ? (
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
          ) : filteredStories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredStories.map((story: any) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-amber-500 mx-auto mb-4" />
              <h3 className="text-xl font-cinzel font-bold text-brown-dark mb-2">
                {searchQuery ? "No stories found" : "No stories yet"}
              </h3>
              <p className="text-gray-600">
                {searchQuery 
                  ? "Try adjusting your search terms" 
                  : "Be the first to publish a Hekayaty Original story!"}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
