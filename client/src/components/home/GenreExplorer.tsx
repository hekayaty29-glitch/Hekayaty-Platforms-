import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Genre } from "@/lib/types";
import { 
  WandSparkles, 
  Heart, 
  Footprints, 
  Rocket, 
  Ghost, 
  Mountain 
} from "lucide-react";

// Map genre icons by name
const genreIcons: Record<string, React.ReactNode> = {
  "Fantasy": <WandSparkles className="h-8 w-8" />,
  "Romance": <Heart className="h-8 w-8" />,
  "Mystery": <Footprints className="h-8 w-8" />,
  "Science Fiction": <Rocket className="h-8 w-8" />,
  "Horror": <Ghost className="h-8 w-8" />,
  "Adventure": <Mountain className="h-8 w-8" />
};

export default function GenreExplorer() {
  const { data: genres, isLoading } = useQuery<Genre[]>({
    queryKey: ["/api/genres"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  if (isLoading) {
    return (
      <section className="py-12 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="font-cinzel text-2xl md:text-3xl font-bold text-brown-dark mb-8 text-center">Explore by Genre</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-gradient-to-br from-amber-500/90 to-amber-800/90 rounded-lg p-4 animate-pulse h-28 shadow-md">
                <div className="flex justify-center mb-3">
                  <div className="w-8 h-8 bg-white/90 rounded-full" />
                </div>
                <div className="h-4 bg-white/90 rounded mx-auto w-2/3" />
                <div className="h-3 bg-white/80 rounded mx-auto w-1/3 mt-1" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
  
  return (
    <section className="py-12 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        <h2 className="font-cinzel text-2xl md:text-3xl font-bold text-brown-dark mb-8 text-center">Explore by Genre</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {genres?.map((genre) => (
            <Link key={genre.id} href={`/genres/${genre.id}`} className="bg-gradient-to-br from-amber-500/90 to-amber-800/90 rounded-lg p-4 text-center cursor-pointer hover:shadow-lg transition-all hover:scale-105">
              <div className="flex justify-center mb-3">
                {genreIcons[genre.name] || <WandSparkles className="h-8 w-8 text-white" />}
              </div>
              <h3 className="font-cinzel font-bold text-white text-shadow-sm tracking-wide">{genre.name}</h3>
              <p className="text-xs mt-1 text-amber-50 font-medium">{Math.floor(Math.random() * 500)} stories</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
