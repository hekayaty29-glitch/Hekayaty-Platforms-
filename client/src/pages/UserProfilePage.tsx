import { useEffect, useState, ChangeEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Helmet } from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import ProfileHeader from "@/components/user/ProfileHeader";
import SubscriptionSection from "@/components/user/SubscriptionSection";
import AchievementsSection from "@/components/user/AchievementsSection";
import SettingsSection from "@/components/user/SettingsSection";
import StoryCard from "@/components/story/StoryCard";
import { StoryCard as StoryCardType, User, Novel, ProfileUpdateData, UserStats } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { BookOpen, Bookmark, CreditCard, History, Camera, Pencil, X, Cog, Trophy } from "lucide-react";

interface UserWithStats extends User {
  followersCount: number;
  followingCount: number;
  stats?: UserStats;
}

export default function UserProfilePage() {
  const [, params] = useRoute("/profile/:id");
  const userId = params ? parseInt(params.id) : 0;
  const { user: currentUser, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const isOwnProfile = currentUser?.id === userId;
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileUpdateData>({
    fullName: "",
    bio: "",
    avatar: "",
    username: ""
  });

  // Fetch user profile with stats
  const { data: fetchedProfile, isLoading: profileLoading } = useQuery<UserWithStats>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/users/${userId}`);
      return res.json();
    },
  });

  // --- DEV MOCK DATA FALLBACK ---
  const mockProfile: UserWithStats = {
    id: userId,
    username: "demo_user",
    email: "demo@example.com",
    fullName: "Demo User",
    bio: "I am a fictional user used for frontend testing.",
    avatar: "https://i.pravatar.cc/150?u=demo",
    isPremium: true,
    isAuthor: true,
    followersCount: 123,
    followingCount: 45,
    stats: {
      storiesPublished: 4,
      wordsWritten: 89000,
      bookmarksReceived: 250,
    },
  } as any;

  // When API fails or returns nothing (dev), use mock
  const profile = fetchedProfile ?? (!profileLoading ? mockProfile : undefined);

  // Fetch user's authored stories
  const { data: authoredStories, isLoading: storiesLoading } = useQuery<StoryCardType[]>({
    queryKey: [`/api/stories?authorId=${userId}`],
    enabled: !!userId,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/stories?authorId=${userId}`);
      return res.json();
    },
  });
  
  // Fetch user's novels
  const { data: userNovels, isLoading: novelsLoading } = useQuery<Novel[]>({
    queryKey: [`/api/novels?authorId=${userId}`],
    enabled: !!userId,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/novels?authorId=${userId}`);
      return res.json();
    },
  });
  
  // Fetch user's purchased content
  const { data: purchasedContent, isLoading: purchasesLoading } = useQuery<{
    stories: StoryCardType[];
    novels: Novel[];
  }>({
    queryKey: ['/api/purchases'],
    enabled: !!userId && isOwnProfile,
    initialData: { stories: [], novels: [] },
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/purchases");
      return res.json();
    },
  });
  
  // Fetch user's bookmarked stories
  const { data: bookmarkedStories, isLoading: bookmarksLoading } = useQuery<StoryCardType[]>({
    queryKey: ['/api/bookmarks'],
    enabled: !!userId && isOwnProfile,
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/bookmarks");
      return res.json();
    },
  });

  // Handle profile photo upload
  const handlePhotoUpload = async (file: File): Promise<void> => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append("avatar", file);
    
    try {
      const res = await apiRequest("POST", `/api/users/${userId}/avatar`, formData);
      const data = await res.json();
      if (currentUser) {
        updateUser({ ...currentUser, avatar: data.avatar });
      }
      await queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast.success("Profile photo updated!");
      return data.avatar;
    } catch (error) {
      console.error("Failed to upload photo:", error);
      toast.error("Failed to update profile photo");
      throw error;
    }
  };

  // Handle profile update
  const updateProfile = useMutation({
    mutationFn: async (data: ProfileUpdateData) => {
      const res = await apiRequest("PUT", `/api/users/${userId}`, data);
      return res.json();
    },
    onSuccess: (data) => {
      if (currentUser) {
        updateUser({ ...currentUser, ...data });
      }
      setIsEditing(false);
      toast.success("Profile updated successfully!");
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update profile");
      console.error(error);
    }
  });
  
  // Update local state when profile data loads
  useEffect(() => {
    if (profile) {
      setProfileData({
        fullName: profile.fullName,
        bio: profile.bio || "",
        avatar: profile.avatar || ""
      });
    }
  }, [profile]);

  // Handle input changes for the profile form
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle profile form submission
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync(profileData);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };
  
  if (profileLoading) {
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
  
  if (!profile) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-10 text-center">
        <h1 className="text-2xl font-cinzel font-bold text-brown-dark">User Not Found</h1>
        <p className="mt-4 text-gray-600">The user profile you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }
  
  const handleDeleteAccount = async () => {
    try {
      await apiRequest("DELETE", "/api/users/me");
      toast.success("Account deleted");
      // redirect to home
      window.location.href = "/";
    } catch (e: any) {
      toast.error(e.message ?? "Failed to delete account");
    }
  };

  return (
    <>
      <Helmet>
        <title>{profile.fullName} - HEKAYATY</title>
        <meta name="description" content={`View ${profile.fullName}'s profile on HEKAYATY. Browse their stories and bookmarks.`} />
      </Helmet>
      
      <div className="bg-gradient-to-b from-amber-500/10 to-amber-50/20 pt-8 pb-16">
        <div className="container mx-auto max-w-6xl px-4">
          <ProfileHeader 
            user={{
              id: profile.id,
              username: profile.username,
              fullName: profile.fullName,
              bio: profile.bio || "",
              avatar: profile.avatar || "",
              isPremium: profile.isPremium || false,
              isAuthor: profile.isAuthor || false,
              email: profile.email,
              stats: {
                storiesCount: authoredStories?.length || 0,
                novelsCount: userNovels?.length || 0,
                followersCount: profile.followersCount || 0,
                followingCount: profile.followingCount || 0,
              }
            }}
            isOwnProfile={isOwnProfile} 
            isPremium={profile.isPremium}
            onPhotoUpload={handlePhotoUpload}
          />
          
          <Separator className="my-8 bg-amber-500/30" />
          
          <Tabs defaultValue="stories" className="w-full">
            <TabsList className="bg-amber-50 border border-amber-500/30">
              <TabsTrigger 
                value="stories" 
                className="font-cinzel data-[state=active]:bg-amber-500 data-[state=active]:text-white flex items-center gap-2"
              >
                <BookOpen className="h-4 w-4" />
                Stories
              </TabsTrigger>
              {isOwnProfile && (
                <TabsTrigger 
                  value="novels" 
                  className="font-cinzel data-[state=active]:bg-amber-500 data-[state=active]:text-white flex items-center gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  My Novels
                </TabsTrigger>
              )}
              {isOwnProfile && (
                <TabsTrigger 
                  value="purchases" 
                  className="font-cinzel data-[state=active]:bg-amber-500 data-[state=active]:text-white flex items-center gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  My Library
                </TabsTrigger>
              )}
              {isOwnProfile && (
                <TabsTrigger 
                  value="bookmarks" 
                  className="font-cinzel data-[state=active]:bg-amber-500 data-[state=active]:text-white flex items-center gap-2"
                >
                  <Bookmark className="h-4 w-4" />
                  Bookmarks
                </TabsTrigger>
              )}
              {isOwnProfile && (
                <TabsTrigger 
                  value="achievements" 
                  className="font-cinzel data-[state=active]:bg-amber-500 data-[state=active]:text-white flex items-center gap-2"
                >
                  <Trophy className="h-4 w-4" />
                  Achievements
                </TabsTrigger>
              )}
              <TabsTrigger 
                value="about" 
                className="font-cinzel data-[state=active]:bg-amber-500 data-[state=active]:text-white flex items-center gap-2"
              >
                <History className="h-4 w-4" />
                About
              </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger 
                value="subscription" 
                className="font-cinzel data-[state=active]:bg-amber-500 data-[state=active]:text-white flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Subscription
              </TabsTrigger>
            )}
            {isOwnProfile && (
              <TabsTrigger 
                value="settings" 
                className="font-cinzel data-[state=active]:bg-amber-500 data-[state=active]:text-white flex items-center gap-2"
              >
                <Cog className="h-4 w-4" />
                Settings
              </TabsTrigger>
            )}
            </TabsList>
            
            <TabsContent value="stories" className="mt-6">
              {storiesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse bg-white rounded-lg h-80"></div>
                  ))}
                </div>
              ) : authoredStories && authoredStories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {authoredStories.map(story => (
                    <StoryCard 
                      key={story.id} 
                      story={story} 
                      isBookmarked={false}
                      isPurchased={false}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-amber-50/50 rounded-lg border border-amber-500/20">
                  <h3 className="font-cinzel text-lg text-brown-dark">No Stories Published Yet</h3>
                  <p className="text-gray-600 mt-2">
                    {isOwnProfile ? 
                      "You haven't published any stories yet. Start writing your first tale!" : 
                      `${profile?.fullName || 'This user'} hasn't published any stories yet.`}
                  </p>
                </div>
              )}
            </TabsContent>

            {isOwnProfile && (
              <TabsContent value="novels" className="mt-6">
                {novelsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse bg-white rounded-lg h-80"></div>
                    ))}
                  </div>
                ) : userNovels && userNovels.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userNovels.map(novel => (
                      <StoryCard 
                        key={novel.id} 
                        story={novel} 
                        isNovel={true}
                        isBookmarked={false}
                        isPurchased={false}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-amber-50/50 rounded-lg border border-amber-500/20">
                    <h3 className="font-cinzel text-lg text-brown-dark">No Novels Yet</h3>
                    <p className="text-gray-600 mt-2">
                      You haven't created any novels yet. Start your first novel today!
                    </p>
                  </div>
                )}
              </TabsContent>
            )}

            {isOwnProfile && (
              <TabsContent value="purchases" className="mt-6">
                {purchasesLoading ? (
                  <div className="space-y-6">
                    <div className="animate-pulse bg-white rounded-lg p-6">
                      <div className="h-6 w-1/4 bg-amber-200 rounded mb-4"></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="animate-pulse bg-amber-50 rounded-lg h-64"></div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div>
                      <h3 className="font-cinzel text-xl text-brown-dark mb-4">Purchased Stories</h3>
                      {purchasedContent?.stories && purchasedContent.stories.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {purchasedContent.stories.map(story => (
                            <StoryCard 
                              key={story.id} 
                              story={story} 
                              isBookmarked={false}
                              isPurchased={true}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-amber-50/50 rounded-lg border border-amber-500/20">
                          <p className="text-gray-600">You haven't purchased any stories yet.</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-cinzel text-xl text-brown-dark mb-4">Purchased Novels</h3>
                      {purchasedContent?.novels && purchasedContent.novels.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {purchasedContent.novels.map(novel => (
                            <StoryCard 
                              key={novel.id} 
                              story={novel} 
                              isNovel={true}
                              isBookmarked={false}
                              isPurchased={true}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-amber-50/50 rounded-lg border border-amber-500/20">
                          <p className="text-gray-600">You haven't purchased any novels yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>
            )}

            {isOwnProfile && (
              <TabsContent value="bookmarks" className="mt-6">
                {bookmarksLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse bg-white rounded-lg h-80"></div>
                    ))}
                  </div>
                ) : bookmarkedStories && bookmarkedStories.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bookmarkedStories.map(story => (
                      <StoryCard 
                        key={story.id} 
                        story={story} 
                        isBookmarked={true}
                        isPurchased={false}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-amber-50/50 rounded-lg border border-amber-500/20">
                    <h3 className="font-cinzel text-lg text-brown-dark">No Bookmarks Yet</h3>
                    <p className="text-gray-600 mt-2">
                      Save stories you love to read later by clicking the bookmark icon.
                    </p>
                  </div>
                )}
              </TabsContent>
            )}

            <TabsContent value="about" className="mt-6">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-amber-500/20">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="font-cinzel text-2xl font-bold text-brown-dark">About {profile?.fullName || 'User'}</h2>
                    <p className="text-gray-600">Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'recently'}</p>
                  </div>
                  {isOwnProfile && (
                    <Button 
                      variant="outline" 
                      className="border-amber-500 text-amber-700 hover:bg-amber-50"
                      onClick={() => setIsEditing(true)}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>

                <div className="prose max-w-none">
                  {profile?.bio ? (
                    <p className="text-gray-700 whitespace-pre-line">{profile.bio}</p>
                  ) : (
                    <p className="text-gray-500 italic">
                      {isOwnProfile 
                        ? "Tell the community about yourself and what you like to write about." 
                        : `${profile?.fullName || 'This user'} hasn't written a bio yet.`}
                    </p>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-amber-100">
                  <h3 className="font-cinzel text-lg font-semibold text-brown-dark mb-4">Stats</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-amber-50 rounded-lg">
                      <p className="text-2xl font-bold text-amber-700">{authoredStories?.length || 0}</p>
                      <p className="text-sm text-gray-600">Stories</p>
                    </div>
                    <div className="text-center p-4 bg-amber-50 rounded-lg">
                      <p className="text-2xl font-bold text-amber-700">{userNovels?.length || 0}</p>
                      <p className="text-sm text-gray-600">Novels</p>
                    </div>
                    <div className="text-center p-4 bg-amber-50 rounded-lg">
                      <p className="text-2xl font-bold text-amber-700">{profile?.followersCount || 0}</p>
                      <p className="text-sm text-gray-600">Followers</p>
                    </div>
                    <div className="text-center p-4 bg-amber-50 rounded-lg">
                      <p className="text-2xl font-bold text-amber-700">{profile?.followingCount || 0}</p>
                      <p className="text-sm text-gray-600">Following</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {isOwnProfile && (
              <TabsContent value="history" className="mt-6">
                <div className="text-center py-12 bg-amber-50/50 rounded-lg border border-amber-500/20">
                  <h3 className="font-cinzel text-lg text-brown-dark">Reading History</h3>
                  <p className="text-gray-600 mt-2">
                    Your reading history will appear here as you read stories on HEKAYATY.
                  </p>
                </div>
              </TabsContent>
            )}

            {isOwnProfile && (
              <TabsContent value="bookmarks" className="mt-6">
                {bookmarksLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse bg-white rounded-lg h-80"></div>
                    ))}
                  </div>
                ) : bookmarkedStories && bookmarkedStories.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bookmarkedStories.map(story => (
                      <StoryCard key={story.id} story={story} isBookmarked={true} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-amber-50/50 rounded-lg border border-amber-500/20">
                    <h3 className="font-cinzel text-lg text-brown-dark">No Bookmarks Yet</h3>
                    <p className="text-gray-600 mt-2">
                      You haven't bookmarked any stories yet. Explore and save stories to read later!
                    </p>
                  </div>
                )}
              </TabsContent>
            )}
            
            {/* Achievements Tab */}
            {isOwnProfile && (
              <TabsContent value="achievements" className="mt-6">
                <AchievementsSection />
              </TabsContent>
            )}

            {/* Novels Tab */}
            <TabsContent value="novels" className="mt-6">
              {novelsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse bg-white rounded-lg h-80"></div>
                  ))}
                </div>
              ) : userNovels && userNovels.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userNovels.map(novel => (
                    <StoryCard key={novel.id} story={novel} isNovel={true} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-amber-50/50 rounded-lg border border-amber-500/20">
                  <h3 className="font-cinzel text-lg text-brown-dark">No Novels Published</h3>
                  <p className="text-gray-600 mt-2">
                    {isOwnProfile ? 
                      "You haven't published any novels yet. Start writing your first novel!" : 
                      `${profile.fullName} hasn't published any novels yet.`}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Purchases Tab */}
            {isOwnProfile && (
              <TabsContent value="purchases" className="mt-6">
                {purchasesLoading ? (
                  <div className="space-y-6">
                    {[1, 2].map((i) => (
                      <div key={i} className="animate-pulse bg-white rounded-lg h-40"></div>
                    ))}
                  </div>
                ) : purchasedContent && 
                   (purchasedContent.stories.length > 0 || purchasedContent.novels.length > 0) ? (
                  <div className="space-y-8">
                    {purchasedContent.stories.length > 0 && (
                      <div>
                        <h4 className="font-cinzel text-lg text-amber-800 mb-4">Purchased Stories</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {purchasedContent.stories.map(story => (
                            <StoryCard key={story.id} story={story} isPurchased={true} />
                          ))}
                        </div>
                      </div>
                    )}
                    {purchasedContent.novels.length > 0 && (
                      <div>
                        <h4 className="font-cinzel text-lg text-amber-800 mb-4">Purchased Novels</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {purchasedContent.novels.map(novel => (
                            <StoryCard key={novel.id} story={novel} isNovel={true} isPurchased={true} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-amber-50/50 rounded-lg border border-amber-500/20">
                    <h3 className="font-cinzel text-lg text-brown-dark">No Purchases Yet</h3>
                    <p className="text-gray-600 mt-2">
                      Your purchased stories and novels will appear here.
                    </p>
                  </div>
                )}
              </TabsContent>
            )}

            {/* About Tab */}
            <TabsContent value="about" className="mt-6">
              <div className="bg-amber-50/50 rounded-lg border border-amber-500/20 p-6">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="font-cinzel text-xl text-brown-dark">About {profile.fullName}</h3>
                  {isOwnProfile && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-amber-500 text-amber-600 hover:bg-amber-50 flex items-center gap-2"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      <Pencil className="h-4 w-4" />
                      {isEditing ? 'Cancel' : 'Edit Profile'}
                    </Button>
                  )}
                </div>
                
                {isEditing ? (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    updateProfile.mutate(profileData);
                  }} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={profileData.fullName}
                        onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        rows={4}
                        value={profileData.bio}
                        onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Profile Photo</Label>
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img 
                            src={profileData.avatar || "/default-avatar.png"} 
                            alt={profile.fullName}
                            className="h-20 w-20 rounded-full object-cover border-2 border-amber-500/30" loading="lazy" decoding="async"
                          />
                          <label 
                            htmlFor="avatar-upload"
                            className="absolute -bottom-2 -right-2 bg-amber-500 text-white p-1.5 rounded-full cursor-pointer hover:bg-amber-600 transition-colors"
                            title="Change photo"
                          >
                            <Camera className="h-4 w-4" />
                            <input
                              id="avatar-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) void handlePhotoUpload(file);
                              }}
                            />
                          </label>
                        </div>
                        <span className="text-sm text-gray-500">Click the camera icon to change your profile photo</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-2">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
                        Save Changes
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <img 
                          src={profile.avatar || "/default-avatar.png"} 
                          alt={profile.fullName}
                          className="h-24 w-24 rounded-full object-cover border-2 border-amber-500/30" loading="lazy" decoding="async"
                        />
                        {isOwnProfile && (
                          <label 
                            htmlFor="avatar-upload"
                            className="absolute -bottom-2 -right-2 bg-amber-500 text-white p-1.5 rounded-full cursor-pointer hover:bg-amber-600 transition-colors"
                            title="Change photo"
                          >
                            <Camera className="h-4 w-4" />
                            <input
                              id="avatar-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) void handlePhotoUpload(file);
                              }}
                            />
                          </label>
                        )}
                      </div>
                      <div>
                        <h4 className="font-cinzel text-lg text-brown-dark">@{profile.username}</h4>
                        <p className="text-amber-600 font-medium">
                          {profile.isPremium ? 'Premium Member' : 'Free Member'}
                        </p>
                      </div>
                    </div>
                    
                    {profile.bio ? (
                      <p className="text-gray-700 whitespace-pre-line">{profile.bio}</p>
                    ) : (
                      <p className="text-gray-500 italic">No bio provided yet.</p>
                    )}
                    
                    <Separator className="my-4 bg-amber-500/20" />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg border border-amber-500/20">
                        <p className="text-sm text-gray-500">Member Since</p>
                        <p className="font-medium">
                          {new Date(profile.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-amber-500/20">
                        <p className="text-sm text-gray-500">Role</p>
                        <p className="font-medium">
                          {profile.isAuthor ? 'Author' : 'Reader'}
                        </p>
                      </div>
                      {profile.isAuthor && (
                        <div className="bg-white p-4 rounded-lg border border-amber-500/20">
                          <p className="text-sm text-gray-500">Stories Published</p>
                          <p className="font-medium">{authoredStories?.length || 0}</p>
                        </div>
                      )}
                      {profile.isAuthor && (
                        <div className="bg-white p-4 rounded-lg border border-amber-500/20">
                          <p className="text-sm text-gray-500">Novels Published</p>
                          <p className="font-medium">{userNovels?.length || 0}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          {isOwnProfile && (
              <TabsContent value="subscription" className="mt-6">
                <SubscriptionSection user={profile} />
              </TabsContent>
            )}

            {isOwnProfile && (
              <TabsContent value="settings" className="mt-6">
                <SettingsSection user={profile} onDeleteAccount={handleDeleteAccount} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-cinzel text-2xl">Edit Profile</DialogTitle>
            <button
              onClick={() => setIsEditing(false)}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </button>
          </DialogHeader>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {/* Username (only if not set) */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={profileData.username || ""}
                onChange={handleInputChange}
                placeholder="Choose a username"
                className="w-full"
                disabled={Boolean(profile?.username && profile?.username !== "null")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                value={profileData.fullName}
                onChange={handleInputChange}
                placeholder="Your full name"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={profileData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself..."
                rows={4}
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Profile Photo</Label>
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-amber-200">
                  <img
                    src={profileData.avatar || "/default-avatar.png"}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handlePhotoUpload(file);
                      }
                    }}
                  />
                  <Label
                    htmlFor="avatar-upload"
                    className="inline-flex items-center px-4 py-2 border border-amber-300 rounded-md shadow-sm text-sm font-medium text-amber-700 bg-white hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Change Photo
                  </Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={updateProfile.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-amber-600 hover:bg-amber-700"
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
