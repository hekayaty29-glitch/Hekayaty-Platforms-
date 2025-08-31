import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import StoryCard from "@/components/story/StoryCard";
import { StoryCard as StoryCardType, Genre } from "@/lib/types";
import { Search, SlidersHorizontal, AlertTriangle } from "lucide-react";
import Container from "@/components/layout/Container";

export default function GenreStoriesPage() {
  const [, params] = useRoute("/genres/:id");
  const genreId = params ? parseInt(params.id) : undefined;
  const [selectedGenreId, setSelectedGenreId] = useState<number | undefined>(genreId);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  
  // Fetch all genres
  const { data: genres, isLoading: genresLoading } = useQuery<Genre[]>({
    queryKey: ["/api/genres"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Fetch stories for the selected genre
  const { data: stories, isLoading: storiesLoading } = useQuery<StoryCardType[]>({
    queryKey: [`/api/stories${selectedGenreId ? `?genreId=${selectedGenreId}` : ''}`],
    enabled: true,
    staleTime: 1000 * 60,
  });
  
  // Update selected genre ID when route changes
  useEffect(() => {
    setSelectedGenreId(genreId);
  }, [genreId]);
  
  // Get selected genre name
  const selectedGenre = genres?.find(g => g.id === selectedGenreId);
  
  // Filter and sort stories
  const filteredStories = stories?.filter(story => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        story.title.toLowerCase().includes(query) ||
        story.description.toLowerCase().includes(query) ||
        story.author?.fullName.toLowerCase().includes(query)
      );
    }
    return true;
  }) || [];
  
  const sortedStories = [...filteredStories].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "rating":
        return b.averageRating - a.averageRating;
      default:
        return 0;
    }
  });
  
  if (!genresLoading && !genres?.length) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-10 text-center">
        <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
        <h1 className="text-2xl font-cinzel font-bold text-brown-dark">No Genres Found</h1>
        <p className="mt-4 text-gray-600">There seem to be no genres available at the moment.</p>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>
          {selectedGenre ? `${selectedGenre.name} Stories` : "Explore Genres"} - TaleKeeper
        </title>
        <meta 
          name="description" 
          content={selectedGenre 
            ? `Discover the best ${selectedGenre.name} stories and novels on TaleKeeper. Read fantasy, adventure, romance, and more.`
            : "Explore stories by genre on TaleKeeper. Find fantasy, romance, mystery, sci-fi, horror, and adventure tales."
          } 
        />
      </Helmet>
      
      <div className="pt-8 pb-16 text-amber-50" style={{ backgroundColor: '#151008' }}>
        <Container>
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-cinzel text-3xl font-bold text-brown-dark">
              {selectedGenre ? `${selectedGenre.name} Stories` : "Explore by Genre"}
            </h1>
            <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
              {selectedGenre 
                ? selectedGenre.description
                : "Discover stories across different genres. Find your next favorite read from our collection."}
            </p>
          </div>
          
          {/* Genre Tabs */}
          {!genreId && genres && (
            <Tabs defaultValue="all" className="w-full mb-8">
              <TabsList className="bg-amber-50/90 border border-amber-500/30 w-full h-auto flex flex-wrap justify-start shadow-sm">
                <TabsTrigger 
                  value="all" 
                  className="font-cinzel font-medium text-brown-dark data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-md"
                  onClick={() => setSelectedGenreId(undefined)}
                >
                  All Genres
                </TabsTrigger>
                
                {genres.map(genre => (
                  <TabsTrigger 
                    key={genre.id}
                    value={genre.name.toLowerCase().replace(/\s+/g, '-')} 
                    className="font-cinzel font-medium text-brown-dark data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-md"
                    onClick={() => setSelectedGenreId(genre.id)}
                  >
                    {genre.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
          
          {/* Genre Cards */}
          {!selectedGenreId && genres && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-10">
              {genres.map(genre => (
                <Link key={genre.id} href={`/genres/${genre.id}`}>
                  <a className="block">
                    <Card className="border-amber-500/30 hover:border-amber-600 transition-all hover:shadow-md bg-amber-50/70">
                      <CardHeader className="pb-2">
                        <CardTitle className="font-cinzel text-brown-dark font-bold flex items-center justify-between">
                          {genre.name}
                          <div className="bg-gradient-to-br from-amber-500 to-amber-700 text-white p-2 rounded-full shadow-sm">
                            <i className={`fa${genre.icon}`}></i>
                          </div>
                        </CardTitle>
                        <CardDescription className="text-gray-700 font-medium">{genre.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          className="w-full bg-amber-800 hover:bg-amber-600 text-white font-medium shadow-sm hover:shadow-md transition-all"
                        >
                          Browse Stories
                        </Button>
                      </CardContent>
                    </Card>
                  </a>
                </Link>
              ))}
            </div>
          )}
          
          {/* Stories Section */}
          {(selectedGenreId || genreId === undefined) && (
            <>
              <Card className="border-amber-500/30 bg-amber-50/90 mb-8 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-grow">
                      <Input
                        placeholder="Search stories by title, description, or author..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-10 border-amber-500/50 focus:border-amber-600 focus:ring-amber-200 text-gray-800 font-medium"
                      />
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-brown-dark" />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="text-amber-800 h-5 w-5" />
                      <Select
                        value={sortBy}
                        onValueChange={setSortBy}
                      >
                        <SelectTrigger className="w-[180px] border-amber-500/50 focus:border-amber-600 text-gray-800 font-medium">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent className="bg-amber-50 border-amber-500/50">
                          <SelectItem value="newest" className="text-gray-800 font-medium">Newest First</SelectItem>
                          <SelectItem value="oldest" className="text-gray-800 font-medium">Oldest First</SelectItem>
                          <SelectItem value="rating" className="text-gray-800 font-medium">Highest Rated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {storiesLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {Array(6).fill(0).map((_, i) => (
                    <div key={i} className="animate-pulse bg-amber-50/80 rounded-lg h-80 border border-amber-500/20 shadow-sm"></div>
                  ))}
                </div>
              ) : sortedStories.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {sortedStories.map(story => (
                    <StoryCard key={story.id} story={story} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-amber-50/60 rounded-lg border border-amber-500/30 shadow-sm">
                  <AlertTriangle className="h-12 w-12 text-amber-600 mx-auto mb-4" />
                  <h3 className="font-cinzel text-xl text-brown-dark font-bold mb-3">No Stories Found</h3>
                  <p className="text-gray-800 font-medium max-w-md mx-auto">
                    {searchQuery 
                      ? "No stories match your search criteria. Try a different search term."
                      : `There are no stories available in ${selectedGenre ? `the ${selectedGenre.name} genre` : 'this category'} yet.`}
                  </p>
                </div>
              )}
            </>
          )}
        </Container>
      </div>
    </>
  );
}
