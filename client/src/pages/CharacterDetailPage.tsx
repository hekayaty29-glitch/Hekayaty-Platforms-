import { useRoute } from "wouter";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Users } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Character {
  id: string;
  name: string;
  description: string;
  backgroundStory: string;
  bio: string;
  characterType: string;
  role: string;
  image: string;
  photo_url: string;
  associatedStories: string[];
  createdAt: string;
  created_at: string;
  updatedAt: string;
  updated_at: string;
}

interface Story {
  id: string;
  title: string;
}

export default function CharacterDetailPage() {
  const [, params] = useRoute<{ id: string }>("/characters/:id");
  const characterId = params?.id;

  // Fetch character data
  const { data: character, isLoading, error } = useQuery<Character>({
    queryKey: ["/api/characters", characterId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/characters/${characterId}`);
      return response.json();
    },
    enabled: !!characterId,
  });

  // Fetch associated stories
  const { data: stories = [] } = useQuery<Story[]>({
    queryKey: ["/api/stories", "character", characterId],
    queryFn: async () => {
      if (!character?.associatedStories?.length) return [];
      const response = await apiRequest("GET", `/api/stories?ids=${character.associatedStories.join(',')}`);
      return response.json();
    },
    enabled: !!character?.associatedStories?.length,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0704] text-amber-50 px-4 py-10">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="animate-pulse">
            <div className="h-6 bg-amber-900/40 rounded w-32 mb-8"></div>
            <div className="flex flex-col md:flex-row gap-6 bg-[#1d140c]/60 backdrop-blur-sm border border-amber-700 rounded-lg p-6">
              <div className="w-56 h-56 bg-amber-900/40 rounded-lg"></div>
              <div className="space-y-4 flex-1">
                <div className="h-8 bg-amber-900/40 rounded w-3/4"></div>
                <div className="h-4 bg-amber-900/40 rounded w-1/2"></div>
                <div className="h-20 bg-amber-900/40 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="min-h-screen bg-[#0b0704] text-amber-50 px-4 py-10">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-cinzel text-2xl text-amber-100 mb-4">Character not found</h1>
          <Link href="/characters">
            <Button className="bg-amber-600 hover:bg-amber-700 text-white font-cinzel">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Characters
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen text-amber-50 px-4 py-10 relative"
      style={{
        backgroundImage: `url(${character.image || character.photo_url || "/placeholder-character.jpg"})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
      <div className="relative z-10">
      <Helmet>
        <title>{character.name} - Hekayaty Character</title>
        <meta name="description" content={character.description} />
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-8">
        <Link href="/characters" className="inline-flex items-center gap-2 text-amber-300 hover:text-amber-400 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Characters
        </Link>

        <div className="bg-[#1d140c]/60 backdrop-blur-sm border border-amber-700 rounded-lg p-6">
          <div className="flex flex-row items-start gap-6">
            {/* Character Image as Icon */}
            <div className="flex-shrink-0">
              <img 
                src={character.image || character.photo_url || "/placeholder-character.jpg"} 
                alt={character.name} 
                className="w-32 h-32 object-cover rounded-lg border-2 border-amber-600"
              />
            </div>

            {/* Character Info */}
            <div className="flex-1 space-y-6">
              <div>
                <h1 className="font-cinzel text-3xl lg:text-4xl text-amber-100 mb-2">
                  {character.name}
                </h1>
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-600/20 text-amber-300 border border-amber-600/30">
                    <Users className="h-3 w-3 mr-1" />
                    {character.characterType || character.role}
                  </span>
                </div>
                <p className="text-amber-200 leading-relaxed text-lg">
                  {character.description}
                </p>
              </div>

              {/* Background Story */}
              {(character.backgroundStory || character.bio) && (
                <div>
                  <h2 className="font-cinzel text-xl text-amber-100 mb-3 flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Background Story
                  </h2>
                  <p className="text-amber-200 leading-relaxed whitespace-pre-line">
                    {character.backgroundStory || character.bio}
                  </p>
                </div>
              )}

              {/* Associated Stories */}
              {stories.length > 0 && (
                <div>
                  <h2 className="font-cinzel text-xl text-amber-100 mb-3">Story Appearances</h2>
                  <div className="grid gap-2">
                    {stories.map((story) => (
                      <Link key={story.id} href={`/story/${story.id}`}>
                        <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-3 hover:bg-amber-900/30 transition-colors cursor-pointer">
                          <h3 className="text-amber-200 font-medium">{story.title}</h3>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button className="bg-amber-600 hover:bg-amber-700 text-white font-cinzel">
                  ✍️ Write with {character.name}
                </Button>
                <Button variant="outline" className="border-amber-700 text-amber-200 hover:bg-amber-900/20 font-cinzel">
                  📖 Read Stories
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Character Stats or Additional Info */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[#1d140c]/40 border border-amber-700/50 rounded-lg p-4">
            <h3 className="font-cinzel text-lg text-amber-100 mb-3">Character Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-amber-300">Type:</span>
                <span className="text-amber-200">{character.characterType || character.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-300">Stories:</span>
                <span className="text-amber-200">{stories.length} appearance{stories.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-300">Created:</span>
                <span className="text-amber-200">
                  {new Date(character.createdAt || character.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#1d140c]/40 border border-amber-700/50 rounded-lg p-4">
            <h3 className="font-cinzel text-lg text-amber-100 mb-3">Community</h3>
            <div className="space-y-3">
              <Button variant="outline" size="sm" className="w-full border-amber-700 text-amber-200 hover:bg-amber-900/20">
                💬 Discuss Character
              </Button>
              <Button variant="outline" size="sm" className="w-full border-amber-700 text-amber-200 hover:bg-amber-900/20">
                ⭐ Add to Favorites
              </Button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
