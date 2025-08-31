import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Star, Bookmark } from "lucide-react";
import { StoryCard } from "@/lib/types";
import { cn, truncateText } from "@/lib/utils";

export default function FeaturedStories() {
  const [currentPage, setCurrentPage] = useState(0);
  
  const { data: stories, isLoading } = useQuery<StoryCard[]>({
    queryKey: ["/api/stories/featured"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Display 3 stories per page
  const storiesPerPage = 3;
  const totalPages = stories ? Math.ceil(stories.length / storiesPerPage) : 0;
  const displayedStories = stories ? stories.slice(
    currentPage * storiesPerPage, 
    (currentPage + 1) * storiesPerPage
  ) : [];
  
  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };
  
  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };
  
  if (isLoading) {
    return (
      <section className="py-12 px-4 bg-gradient-to-b from-amber-800/40 to-amber-50/80">
        <div className="container mx-auto max-w-6xl">
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-cinzel text-2xl md:text-3xl font-bold text-brown-dark">Featured Stories</h2>
            <Link href="/originals" className="text-amber-500 hover:text-amber-700 font-cinzel text-sm flex items-center transition-colors">
              View All <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-amber-50 rounded-lg shadow-lg overflow-hidden animate-pulse">
                <div className="w-full h-48 bg-amber-200" />
                <div className="p-4">
                  <div className="h-5 bg-amber-200 rounded w-1/3 mb-2" />
                  <div className="h-4 bg-amber-200 rounded w-2/3 mb-3" />
                  <div className="h-16 bg-amber-200 rounded mb-3" />
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-amber-200 rounded-full" />
                      <div className="h-4 bg-amber-200 rounded w-24 ml-2" />
                    </div>
                    <div className="h-4 w-4 bg-amber-200 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
  
  return (
    <section className="py-12 px-4 bg-gradient-to-b from-amber-800/40 to-amber-50/80">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-cinzel text-2xl md:text-3xl font-bold text-brown-dark">Featured Stories</h2>
          <Link href="/stories" className="text-amber-500 hover:text-amber-700 font-cinzel text-sm flex items-center transition-colors">
            View All <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        <div className="relative featured-carousel">
          {/* Navigation arrows */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-5 bg-brown-dark bg-opacity-50 hover:bg-opacity-70 text-amber-50 rounded-full p-2 z-10 hidden md:flex"
            onClick={prevPage}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayedStories.map((story) => (
              <div key={story.id} className="story-card bg-amber-50 rounded-lg shadow-lg overflow-hidden">
                <Link href={`/story/${story.id}`}>
                  <img 
                    src={story.coverImage || "https://images.unsplash.com/photo-1589998059171-988d887df646?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"} 
                    alt={`Cover for ${story.title}`} 
                    className="w-full h-48 object-cover" 
                  />
                </Link>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-wrap gap-1">
                      {story.genres.slice(0, 2).map((genre) => (
                        <Link key={genre.id} href={`/genres/${genre.id}`} className={cn(
                          "text-xs font-cinzel text-white px-2 py-1 rounded",
                          genre.id % 2 === 0 ? "bg-amber-500" : "bg-amber-800"
                        )}>
                          {genre.name}
                        </Link>
                      ))}
                    </div>
                    <div className="flex items-center text-amber-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="ml-1 text-sm">{story.averageRating.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <Link href={`/story/${story.id}`} className="hover:text-amber-700">
                    <h3 className="font-cinzel text-lg font-bold mb-1">{story.title}</h3>
                  </Link>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {truncateText(story.description, 120)}
                  </p>
                  
                  <div className="flex justify-between items-center">
                    <Link href={`/profile/${story.author?.id}`} className="flex items-center group">
                      <img 
                        src={story.author?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"} 
                        className="w-8 h-8 rounded-full object-cover" 
                        alt={`${story.author?.fullName}'s avatar`} 
                      />
                      <span className="ml-2 text-sm font-medium group-hover:text-amber-700">
                        {story.author?.fullName}
                      </span>
                    </Link>
                    <Button variant="ghost" size="icon" className="text-amber-500 hover:text-amber-700 transition-colors">
                      <Bookmark className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-5 bg-brown-dark bg-opacity-50 hover:bg-opacity-70 text-amber-50 rounded-full p-2 z-10 hidden md:flex"
            onClick={nextPage}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        
        {totalPages > 1 && (
          <div className="flex justify-center mt-6 md:hidden">
            {Array(totalPages).fill(0).map((_, i) => (
              <Button 
                key={i}
                variant="ghost"
                size="icon"
                className={cn(
                  "w-2 h-2 p-0 rounded-full mx-1",
                  i === currentPage ? "bg-amber-500" : "bg-gray-300 hover:bg-amber-300"
                )}
                onClick={() => setCurrentPage(i)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
