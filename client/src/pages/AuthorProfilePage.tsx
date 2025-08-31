import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Helmet } from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import ProfileHeader from "@/components/user/ProfileHeader";
import StoryCard from "@/components/story/StoryCard";
import { StoryCard as StoryCardType } from "@/lib/types";

export default function AuthorProfilePage() {
  const [, params] = useRoute("/author/:id");
  const authorId = params ? parseInt(params.id) : 0;
  
  // Fetch author profile
  const { data: author, isLoading: authorLoading } = useQuery({
    queryKey: [`/api/users/${authorId}`],
    enabled: !!authorId,
  });
  
  // Fetch author's stories
  const { data: stories, isLoading: storiesLoading } = useQuery<StoryCardType[]>({
    queryKey: [`/api/stories?authorId=${authorId}`],
    enabled: !!authorId,
  });
  
  if (authorLoading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="animate-pulse">
          <div className="w-full h-36 rounded-lg bg-amber-200 mb-6"></div>
          <div className="w-1/3 h-8 bg-amber-200 rounded mb-2"></div>
          <div className="w-2/3 h-4 bg-amber-200 rounded mb-8"></div>
          <div className="w-full h-96 bg-amber-100 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (!author) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-10 text-center">
        <h1 className="text-2xl font-cinzel font-bold text-brown-dark">Author Not Found</h1>
        <p className="mt-4 text-gray-600">The author profile you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }
  
  // Filter stories by type
  const novels = stories?.filter(story => !story.isShortStory) || [];
  const shortStories = stories?.filter(story => story.isShortStory) || [];
  
  return (
    <>
      <Helmet>
        <title>{author.fullName} - Author Profile | TaleKeeper</title>
        <meta name="description" content={`Explore books and stories by ${author.fullName} on TaleKeeper. Read their latest novels and short stories.`} />
      </Helmet>
      
      <div className="bg-gradient-to-b from-amber-500/10 to-amber-50/20 pt-8 pb-16">
        <div className="container mx-auto max-w-6xl px-4">
          <ProfileHeader 
            user={author} 
            isOwnProfile={false} 
            isPremium={author.isPremium}
            isAuthorPage={true}
          />
          
          <Separator className="my-8 bg-amber-500/30" />
          
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="bg-amber-50 border border-amber-500/30">
              <TabsTrigger 
                value="all" 
                className="font-cinzel data-[state=active]:bg-amber-500 data-[state=active]:text-white"
              >
                All Works
              </TabsTrigger>
              <TabsTrigger 
                value="novels" 
                className="font-cinzel data-[state=active]:bg-amber-500 data-[state=active]:text-white"
              >
                Novels
              </TabsTrigger>
              <TabsTrigger 
                value="short-stories" 
                className="font-cinzel data-[state=active]:bg-amber-500 data-[state=active]:text-white"
              >
                Short Stories
              </TabsTrigger>
              <TabsTrigger 
                value="about" 
                className="font-cinzel data-[state=active]:bg-amber-500 data-[state=active]:text-white"
              >
                About
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-6">
              {storiesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse bg-white rounded-lg h-64"></div>
                  ))}
                </div>
              ) : stories && stories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {stories.map(story => (
                    <StoryCard key={story.id} story={story} variant="horizontal" />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-amber-50/50 rounded-lg border border-amber-500/20">
                  <h3 className="font-cinzel text-lg text-brown-dark">No Works Published Yet</h3>
                  <p className="text-gray-600 mt-2">
                    {author.fullName} hasn't published any stories yet.
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="novels" className="mt-6">
              {storiesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2].map((i) => (
                    <div key={i} className="animate-pulse bg-white rounded-lg h-64"></div>
                  ))}
                </div>
              ) : novels.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {novels.map(story => (
                    <StoryCard key={story.id} story={story} variant="horizontal" />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-amber-50/50 rounded-lg border border-amber-500/20">
                  <h3 className="font-cinzel text-lg text-brown-dark">No Novels Published Yet</h3>
                  <p className="text-gray-600 mt-2">
                    {author.fullName} hasn't published any novels yet.
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="short-stories" className="mt-6">
              {storiesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2].map((i) => (
                    <div key={i} className="animate-pulse bg-white rounded-lg h-64"></div>
                  ))}
                </div>
              ) : shortStories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {shortStories.map(story => (
                    <StoryCard key={story.id} story={story} variant="horizontal" />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-amber-50/50 rounded-lg border border-amber-500/20">
                  <h3 className="font-cinzel text-lg text-brown-dark">No Short Stories Published Yet</h3>
                  <p className="text-gray-600 mt-2">
                    {author.fullName} hasn't published any short stories yet.
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="about" className="mt-6">
              <div className="bg-amber-50/50 rounded-lg border border-amber-500/20 p-6">
                <h3 className="font-cinzel text-xl text-brown-dark mb-4">About {author.fullName}</h3>
                {author.bio ? (
                  <p className="text-gray-700 whitespace-pre-line">{author.bio}</p>
                ) : (
                  <p className="text-gray-500 italic">This author hasn't provided a bio yet.</p>
                )}
                
                <div className="mt-6">
                  <h4 className="font-cinzel text-lg text-brown-dark mb-2">Author Stats</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li>
                      <span className="font-semibold">Published works:</span> {stories?.length || 0}
                    </li>
                    <li>
                      <span className="font-semibold">Novels:</span> {novels.length}
                    </li>
                    <li>
                      <span className="font-semibold">Short stories:</span> {shortStories.length}
                    </li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
