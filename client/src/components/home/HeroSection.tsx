import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Genre } from "@/lib/types";

export default function HeroSection() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: genres } = useQuery<Genre[]>({
    queryKey: ["/api/genres"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
    }
  };
  
  return (
    <section className="hero-section text-amber-50 py-32 md:py-36 lg:py-40 px-4">
      <div className="container mx-auto max-w-5xl text-center">
        <h1 className="font-cinzel text-4xl md:text-6xl font-bold mb-6 text-shadow">
          Enter the Realm of <span className="text-amber-500">Tales</span>
        </h1>
        <p className="font-cormorant text-xl md:text-2xl italic mb-8 max-w-3xl mx-auto text-shadow-sm">
          Embark on epic journeys through enchanted castles and mystical kingdoms crafted by passionate storytellers.
        </p>
        
        <div className="backdrop-blur-sm bg-black/30 p-6 rounded-lg shadow-lg max-w-4xl mx-auto mb-10">
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-6">
            <form onSubmit={handleSearch} className="relative w-full md:w-2/3">
              <Input
                type="text"
                placeholder="Search for stories, authors, or genres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-6 px-5 bg-opacity-20 bg-amber-50 text-amber-50 placeholder-amber-50 placeholder-opacity-70 border border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-full"
              />
              <Button 
                type="submit"
                variant="ghost" 
                size="icon" 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-500 hover:text-amber-300 transition-colors"
              >
                <Search className="h-5 w-5" />
              </Button>
            </form>
            
            <Button 
              asChild
              className="bg-amber-500 hover:bg-amber-600 text-white font-cinzel py-6 px-8 rounded-full"
            >
              <Link href="/originals">Start Reading</Link>
            </Button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3">
            {genres?.map((genre) => (
              <Link key={genre.id} href={`/genres/${genre.id}`} className="genre-badge text-xs md:text-sm font-cinzel py-1 px-3 rounded-full cursor-pointer">
                {genre.name}
              </Link>
            ))}
          </div>
        </div>
        
        <div className="mt-12 flex justify-center">
          <Button 
            asChild
            className="bg-amber-800/80 hover:bg-amber-800 text-amber-50 font-cinzel py-3 px-8 rounded-lg border border-amber-500/50 hover:border-amber-500"
          >
            <Link href="/register?premium=true">Premium Adventure Awaits</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
