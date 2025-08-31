import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import bgImg from "@/assets/00a75467-b343-4cf1-a5c7-0b7d1270efc4.png";
import { Button } from "@/components/ui/button";
import { ChevronRight, Star, StarHalf } from "lucide-react";
import { StoryCard } from "@/lib/types";
import { getRatingStars } from "@/lib/utils";

export default function TopRatedSection() {
  const { data: stories, isLoading } = useQuery<(StoryCard & { ratingCount: number })[]>({
    queryKey: ["/api/stories/top-rated"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  if (isLoading) {
    return (
      <section
        className="relative py-12 px-4 text-amber-50 bg-center bg-cover"
        style={{ backgroundImage: `url(${bgImg})` }}
      >
        <div className="absolute inset-0 bg-brown-dark/25" />
        <div className="relative container mx-auto max-w-6xl">
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-cinzel text-2xl md:text-3xl font-bold text-brown-dark">Top Rated This Month</h2>
            <Link href="/top-rated" className="text-amber-500 hover:text-amber-700 font-cinzel text-sm flex items-center transition-colors">
              View All <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="relative">
                  <div className="w-full h-44 bg-amber-200" />
                  <div className="absolute top-0 left-0 bg-amber-500 p-3" />
                </div>
                <div className="p-4">
                  <div className="h-5 bg-amber-200 rounded w-2/3 mb-2" />
                  <div className="h-4 bg-amber-200 rounded w-1/3 mb-2" />
                  <div className="h-4 bg-amber-200 rounded w-2/3 mb-3" />
                  <div className="h-8 bg-amber-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
  
  return (
    <section
        className="relative py-12 px-4 text-amber-50 bg-center bg-cover"
        style={{ backgroundImage: `url(${bgImg})` }}
      >
        <div className="absolute inset-0 bg-brown-dark/25" />
        <div className="relative container mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-cinzel text-2xl md:text-3xl font-bold text-brown-dark">Top Rated This Month</h2>
          <Link href="/top-rated" className="text-amber-500 hover:text-amber-700 font-cinzel text-sm flex items-center transition-colors">
            View All <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stories?.map((story, index) => {
            const stars = getRatingStars(story.averageRating);
            
            return (
              <div key={story.id} className="story-card bg-white rounded-lg shadow-md overflow-hidden">
                <div className="relative">
                  <Link href={`/story/${story.id}`}>
                    <img 
                      src={story.coverImage || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"} 
                      alt={`Cover for ${story.title}`} 
                      className="w-full h-44 object-cover" 
                    />
                  </Link>
                  <div className="absolute top-0 left-0 bg-amber-500 text-white px-3 py-1 font-bold font-cinzel text-sm">
                    #{index + 1}
                  </div>
                </div>
                <div className="p-4">
                  <Link href={`/story/${story.id}`} className="hover:text-amber-700">
                    <h3 className="font-cinzel text-lg font-bold mb-1 truncate">{story.title}</h3>
                  </Link>
                  
                  <div className="flex items-center mb-2">
                    <div className="flex text-amber-500">
                      {stars.map((star, i) => (
                        star === 'full' ? 
                          <Star key={i} className="h-4 w-4 fill-current" /> : 
                          star === 'half' ? 
                            <StarHalf key={i} className="h-4 w-4 fill-current" /> : 
                            <Star key={i} className="h-4 w-4" />
                      ))}
                    </div>
                    <span className="ml-2 text-xs text-gray-600">({story.ratingCount} votes)</span>
                  </div>
                  
                  <p className="text-xs text-gray-500 mb-3">
                    By {story.author?.fullName || 'Unknown'} • {story.genres.map(g => g.name).join(', ')}
                  </p>
                  
                  <Button asChild className="w-full bg-amber-800 hover:bg-amber-500 text-white py-2 rounded-md transition-colors text-sm font-cinzel">
                    <Link href={`/story/${story.id}`}>Read Now</Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
