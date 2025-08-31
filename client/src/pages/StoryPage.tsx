import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Helmet } from "react-helmet";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ReportDialog from "@/components/common/ReportDialog";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Star, 
  StarHalf, 
  BookOpen, 
  Heart, 
  MessageCircle, 
  Share2, 
  Flag,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  FileText,
  Plus,
  AlertTriangle,
  Calendar,
  Clock,
  Bookmark
} from "lucide-react";
import { StoryDetail, Rating } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn, formatDate, calculateReadTime, getRatingStars } from "@/lib/utils";
import { Reader } from "@/components/story/Reader";
import OriginalPdfViewer from "@/components/story/OriginalPdfViewer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import CommentsSection from "@/components/common/CommentsSection";

const ratingFormSchema = z.object({
  rating: z.number().min(1).max(5),
  review: z.string().max(500),
});

export default function StoryPage() {
  const [, params] = useRoute<{ id: string }>("/story/:id");
  
  if (!params || !params.id) {
    return <div>Story not found</div>;
  }
  
  const storyId = params.id;
  console.log('StoryPage params:', params);
  console.log('StoryPage storyId:', storyId);
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.username === 'Admin';
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRating, setSelectedRating] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [userRating, setUserRating] = useState<Rating | null>(null);
  const [showChapterUpload, setShowChapterUpload] = useState(false);
  const [uploadingChapter, setUploadingChapter] = useState(false);
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterOrder, setChapterOrder] = useState(1);

  const form = useForm<z.infer<typeof ratingFormSchema>>({
    resolver: zodResolver(ratingFormSchema),
    defaultValues: {
      rating: 0,
      review: "",
    },
  });
  
  // Fetch content details (story or comic)
  const { data: content, isLoading, error } = useQuery({
    queryKey: ["content", storyId],
    queryFn: async () => {
      console.log('Fetching content for ID:', storyId);
      try {
        // Try fetching as story first
        console.log('Trying to fetch as story...');
        const { getEdgeFunctionUrl, EDGE_FUNCTIONS } = await import('../lib/api-config');
        const storyResponse = await apiRequest("GET", `${getEdgeFunctionUrl(EDGE_FUNCTIONS.STORIES_READ)}?id=${storyId}`);
        if (!storyResponse.ok) {
          throw new Error(`Story API failed: ${storyResponse.status}`);
        }
        const storyData = await storyResponse.json();
        console.log('Story data found:', storyData);
        return { ...storyData, contentType: 'story' };
      } catch (storyError) {
        console.log('Story fetch failed:', storyError);
        try {
          // If story fails, try fetching as comic
          console.log('Trying to fetch as comic...');
          const comicResponse = await apiRequest("GET", `/api/comics/${storyId}`);
          if (!comicResponse.ok) {
            throw new Error(`Comic API failed: ${comicResponse.status}`);
          }
          const comicData = await comicResponse.json();
          console.log('Comic data found:', comicData);
          return { ...comicData, contentType: 'comic' };
        } catch (comicError) {
          console.log('Comic fetch failed:', comicError);
          throw new Error('Content not found');
        }
      }
    },
    enabled: !!storyId,
    retry: false,
  }) as { data: any, isLoading: boolean, error: any };

  // For backward compatibility, alias content as story
  const story = content;

  // Fetch chapters only for stories (not comics)
  const { data: chaptersData, isLoading: chaptersLoading, error: chaptersError } = useQuery({
    queryKey: ["story-chapters", storyId],
    queryFn: async () => {
      console.log('Fetching chapters for story:', storyId);
      const { getEdgeFunctionUrl, EDGE_FUNCTIONS } = await import('../lib/api-config');
      const response = await apiRequest("GET", `${getEdgeFunctionUrl(EDGE_FUNCTIONS.STORIES_CHAPTERS)}?storyId=${storyId}`);
      console.log('Chapters API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Chapters API error:', errorText);
        throw new Error(`Failed to fetch chapters: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Chapters API response:', data);
      return data;
    },
    enabled: !!storyId && story?.contentType === 'story',
  }) as { data: any, isLoading: boolean, error: any };

  // Chapter upload mutation
  const uploadChapterMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      console.log('Uploading chapter for story:', storyId);
      console.log('FormData contents:', Array.from(formData.entries()));
      
      const { getEdgeFunctionUrl, EDGE_FUNCTIONS } = await import('../lib/api-config');
      const response = await apiRequest("POST", getEdgeFunctionUrl(EDGE_FUNCTIONS.STORIES_CHAPTERS), formData);
      
      console.log('Upload response:', response);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Chapter uploaded successfully!",
      });
      setShowChapterUpload(false);
      setChapterTitle("");
      setChapterOrder(1);
      // Refetch chapters
      queryClient.invalidateQueries({ queryKey: ["story-chapters", storyId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to upload chapter. Please try again.",
        variant: "destructive",
      });
      console.error('Chapter upload error:', error);
    },
  });

  // Handle chapter upload
  const handleChapterUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!storyId) {
      toast({
        title: "Error",
        description: "Story ID is missing. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData(e.currentTarget);
    const file = formData.get('chapters') as File;
    
    console.log('Form submission - storyId:', storyId);
    console.log('Form submission - file:', file);
    console.log('Form submission - chapterTitle:', chapterTitle);
    console.log('Form submission - chapterOrder:', chapterOrder);
    
    if (!file || !chapterTitle.trim()) {
      toast({
        title: "Error",
        description: "Please provide both a chapter title and file.",
        variant: "destructive",
      });
      return;
    }

    // Clear existing FormData and rebuild it properly
    const uploadFormData = new FormData();
    uploadFormData.append('chapters', file);
    uploadFormData.append('chapterNames', chapterTitle);
    uploadFormData.append('chapterOrders', chapterOrder.toString());
    
    setUploadingChapter(true);
    try {
      await uploadChapterMutation.mutateAsync(uploadFormData);
    } catch (error) {
      console.error('Upload error in handleChapterUpload:', error);
    } finally {
      setUploadingChapter(false);
    }
  };

  // Function to get story content - either from chapters or fallback to story.content
  const getStoryContent = () => {
    console.log('Chapters data:', chaptersData); // Debug log
    
    if ((chaptersData as any)?.chapters && (chaptersData as any).chapters.length > 0) {
      console.log('Found chapters:', (chaptersData as any).chapters.length); // Debug log
      
      // Combine all chapters content
      const combinedContent = (chaptersData as any).chapters
        .sort((a: any, b: any) => a.chapter_order - b.chapter_order)
        .map((chapter: any) => {
          console.log('Processing chapter:', chapter.title, 'Order:', chapter.chapter_order, 'Type:', chapter.file_type); // Debug log
          
          if (chapter.file_type === 'text' && chapter.content) {
            return `# ${chapter.title}\n\n${chapter.content}`;
          } else if (chapter.file_type === 'pdf' && chapter.file_url) {
            return `# ${chapter.title}\n\n[PDF_CHAPTER:${chapter.file_url}]`;
          } else if (chapter.file_type === 'audio' && chapter.file_url) {
            return `# ${chapter.title}\n\n[AUDIO_CHAPTER:${chapter.file_url}]`;
          } else if (chapter.file_type === 'image' && chapter.file_url) {
            return `# ${chapter.title}\n\n[IMAGE_CHAPTER:${chapter.file_url}]`;
          }
          return `# ${chapter.title}\n\nChapter content not available.`;
        })
        .join('\n\n---\n\n');
        
      console.log('Combined content length:', combinedContent.length); // Debug log
      return combinedContent;
    }
    
    console.log('No chapters found, using story content'); // Debug log
    console.log('Story data:', story); // Debug log
    console.log('Chapters loading:', chaptersLoading); // Debug log
    console.log('Chapters error:', chaptersError); // Debug log
    
    // Fallback to story.content if no chapters
    return (story as any)?.content || 'No content available.';
  };

  // Fetch story ratings
  const { data: ratings } = useQuery<Rating[]>({
    queryKey: [`/api/stories/${storyId}/ratings`],
    enabled: !!storyId && storyId !== "",
  });
  
  // Update state when story data is loaded
  useEffect(() => {
    if (story) {
      setIsBookmarked(story?.isBookmarked || false);
    }
  }, [story]);
  
  // Find user's existing rating if any
  useEffect(() => {
    if (ratings && user) {
      const userRating = ratings.find(r => r.userId === user.id);
      if (userRating) {
        setSelectedRating(userRating.rating);
        form.setValue("rating", userRating.rating);
        form.setValue("review", userRating.review);
      }
    }
  }, [ratings, user, form]);
  
  // Bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (isBookmarked) {
        const { getEdgeFunctionUrl, EDGE_FUNCTIONS } = await import('../lib/api-config');
        const res = await apiRequest("DELETE", `${getEdgeFunctionUrl(EDGE_FUNCTIONS.STORIES_UPDATE)}?bookmark=true&storyId=${storyId}`, {});
        return res.json();
      } else {
        const { getEdgeFunctionUrl, EDGE_FUNCTIONS } = await import('../lib/api-config');
        const res = await apiRequest("POST", `${getEdgeFunctionUrl(EDGE_FUNCTIONS.STORIES_UPDATE)}?bookmark=true&storyId=${storyId}`, {});
        return res.json();
      }
    },
    onSuccess: () => {
      setIsBookmarked(!isBookmarked);
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      toast({
        title: isBookmarked ? "Removed from library" : "Added to library",
        description: isBookmarked 
          ? "Story has been removed from your library" 
          : "Story has been added to your library",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Action failed",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });
  
  // Rating mutation
  const ratingMutation = useMutation({
    mutationFn: async (data: { rating: number; review: string }) => {
      const { getEdgeFunctionUrl, EDGE_FUNCTIONS } = await import('../lib/api-config');
      const res = await apiRequest("POST", `${getEdgeFunctionUrl(EDGE_FUNCTIONS.STORIES_UPDATE)}?rate=true&storyId=${storyId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/stories/${storyId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/stories/${storyId}/ratings`] });
      setShowRatingForm(false);
      toast({
        title: "Rating submitted",
        description: "Thank you for rating this story!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Rating failed",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });
  
  const handleBookmark = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to bookmark stories",
        variant: "destructive",
      });
      return;
    }
    
    bookmarkMutation.mutate();
  };
  
  const handleSetRating = (rating: number) => {
    setSelectedRating(rating);
    form.setValue("rating", rating);
  };
  
  const onSubmitRating = (data: z.infer<typeof ratingFormSchema>) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to rate stories",
        variant: "destructive",
      });
      return;
    }
    
    ratingMutation.mutate({
      rating: data.rating,
      review: data.review,
    });
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="animate-pulse">
          <div className="w-2/3 h-10 bg-amber-200 rounded mb-4"></div>
          <div className="w-1/3 h-6 bg-amber-200 rounded mb-6"></div>
          <div className="w-full h-96 bg-amber-100 rounded"></div>
        </div>
      </div>
    );
  }
  
  
  if (!story) {
    console.log('Story is null/undefined. Error:', error);
    console.log('Loading state:', isLoading);
    console.log('Content data:', content);
    return (
      <div className="container mx-auto max-w-6xl px-4 py-10 text-center">
        <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
        <h1 className="text-2xl font-cinzel font-bold text-brown-dark">Story Not Found</h1>
        <p className="mt-4 text-gray-600">The story you're looking for doesn't exist or has been removed.</p>
        {error && (
          <p className="mt-2 text-red-600 text-sm">Error: {error.message}</p>
        )}
        <Button asChild className="mt-6 bg-amber-500 hover:bg-amber-600">
          <Link href="/stories">
            Browse Stories
          </Link>
        </Button>
      </div>
    );
  }

  // If this is an Original with a PDF, show custom viewer
  if (story.isOriginal && story.pdfUrl) {
    return (
      <OriginalPdfViewer
        title={story.title}
        author={story.author?.fullName || "Unknown"}
        pdfUrl={story.pdfUrl}
        audioUrl={story.soundtrackUrl}
      />
    );
  }

  const readTime = calculateReadTime(getStoryContent() || story?.content || "");
  const starsRating = getRatingStars(story.averageRating || 0);
  
  return (
    <>
      <Helmet>
        <title>{story?.title || 'Story'} - TaleKeeper</title>
        <meta name="description" content={story?.description || ''} />
      </Helmet>
      
      <div 
        className="bg-gradient-to-b from-amber-500/5 to-amber-50/10 pt-8 pb-16 relative"
        style={{
          backgroundImage: story.cover_url || story.coverImage || story.coverUrl ? 
            `linear-gradient(rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.2)), url(${story.cover_url || story.coverImage || story.coverUrl})` : 
            undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="container mx-auto max-w-6xl px-4">
          {/* Story Header */}
          <div className="flex flex-col md:flex-row gap-8 mb-8">
            <div className="md:w-1/3">
              <img 
                src={story.cover_url || story.coverImage || story.coverUrl || "https://images.unsplash.com/photo-1589998059171-988d887df646?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"} 
                alt={`Cover for ${story.title}`} 
                className="w-full h-auto object-cover rounded-lg shadow-lg" 
                onError={(e) => {
                  console.log('Cover image failed to load:', story.cover_url);
                  console.log('Fallback to default image');
                }}
              />
            </div>
            
            <div className="md:w-2/3">
              <div className="flex flex-wrap gap-2 mb-3">
                {story.genres?.map((genre: any) => (
                  <Link key={genre.id} href={`/genres/${genre.id}`}>
                    <a className={cn(
                      "text-xs font-cinzel text-white px-2 py-1 rounded",
                      genre.id % 2 === 0 ? "bg-amber-500" : "bg-amber-800"
                    )}>
                      {genre.name}
                    </a>
                  </Link>
                ))}
                {story.isPremium && (
                  <span className="text-xs font-cinzel text-white px-2 py-1 rounded bg-gold-rich">
                    Premium
                  </span>
                )}
              </div>
              
              <h1 className="font-cinzel text-3xl md:text-4xl font-bold text-white drop-shadow-md mb-3">
                {story.title}
              </h1>
              
              <div className="flex items-center mb-4">
                <div className="flex text-amber-500 mr-3">
                  {starsRating.map((star, i) => (
                    star === 'full' ? 
                      <Star key={i} className="h-5 w-5 fill-current" /> : 
                      star === 'half' ? 
                        <StarHalf key={i} className="h-5 w-5 fill-current" /> : 
                        <Star key={i} className="h-5 w-5" />
                  ))}
                </div>
                <span className="text-white/90 drop-shadow-sm">
                  {(story.averageRating || 0).toFixed(1)} ({story.ratingCount || 0} ratings)
                </span>
              </div>
              
              <p className="text-white/90 mb-5 drop-shadow-sm">{story.description}</p>
              
              <Link href={`/author/${story.author?.id}`}>
                <div className="flex items-center group mb-5">
                  <img 
                    src={story.author?.avatar_url || story.author?.avatarUrl || story.author?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"} 
                    className="w-10 h-10 rounded-full object-cover" 
                    alt={`${story.author?.fullName}'s avatar`} 
                  />
                  <div className="ml-3">
                    <span className="block text-white font-medium drop-shadow-sm group-hover:text-amber-300">
                      {story.author?.fullName}
                    </span>
                    <span className="text-sm text-white/70">
                      Author
                    </span>
                  </div>
                </div>
              </Link>
              
              <div className="flex flex-wrap items-center text-white/80 text-sm gap-4 mb-6">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Published {formatDate(story?.createdAt || story?.created_at)}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{readTime} min read</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {/* Chapter Upload Button - Show for authenticated users */}
                {isAuthenticated && (
                  <Dialog open={showChapterUpload} onOpenChange={setShowChapterUpload}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="border-green-500 text-green-700 bg-transparent hover:bg-green-500 hover:text-white">
                        <Upload className="mr-2 h-4 w-4" />
                        Add Chapter
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-amber-50 border-amber-500">
                      <DialogHeader>
                        <DialogTitle className="font-cinzel text-brown-dark">Upload New Chapter</DialogTitle>
                        <DialogDescription>
                          Add a new chapter to "{story.title}". Supports PDF, text, audio, and image files.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <form onSubmit={handleChapterUpload} className="space-y-4">
                        <div>
                          <Label htmlFor="chapterTitle" className="font-cinzel">Chapter Title</Label>
                          <Input
                            id="chapterTitle"
                            value={chapterTitle}
                            onChange={(e) => setChapterTitle(e.target.value)}
                            placeholder="Enter chapter title..."
                            className="border-amber-500/50 focus:border-amber-500"
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="chapterOrder" className="font-cinzel">Chapter Order</Label>
                          <Input
                            id="chapterOrder"
                            type="number"
                            min="1"
                            value={chapterOrder}
                            onChange={(e) => setChapterOrder(parseInt(e.target.value) || 1)}
                            className="border-amber-500/50 focus:border-amber-500"
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="chapterFile" className="font-cinzel">Chapter File</Label>
                          <Input
                            id="chapterFile"
                            name="chapters"
                            type="file"
                            accept=".pdf,.txt,.doc,.docx,.mp3,.wav,.jpg,.jpeg,.png,.gif"
                            className="border-amber-500/50 focus:border-amber-500"
                            required
                          />
                          <p className="text-sm text-gray-600 mt-1">
                            Supported formats: PDF, Text, Audio (MP3, WAV), Images (JPG, PNG, GIF)
                          </p>
                        </div>
                        
                        <DialogFooter>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setShowChapterUpload(false)}
                            disabled={uploadingChapter}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            className="bg-green-500 hover:bg-green-600 text-white"
                            disabled={uploadingChapter}
                          >
                            {uploadingChapter ? (
                              <>
                                <Upload className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Chapter
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
                
                <Dialog open={showRatingForm} onOpenChange={setShowRatingForm}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-amber-500 text-brown-dark bg-transparent hover:bg-amber-500 hover:text-white">
                      <Star className="mr-2 h-4 w-4" />
                      Rate this Story
                    </Button>
                  </DialogTrigger>

                  <ReportDialog contentId={storyId} contentType="story" />
                  <DialogContent className="bg-amber-50 border-amber-500">
                    <DialogHeader>
                      <DialogTitle className="font-cinzel text-brown-dark">Rate this Story</DialogTitle>
                      <DialogDescription>
                        Share your thoughts on "{story.title}"
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmitRating)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="rating"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-cinzel">Your Rating</FormLabel>
                              <FormControl>
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((rating) => (
                                    <button
                                      key={rating}
                                      type="button"
                                      className="text-amber-500 hover:text-amber-600 focus:outline-none"
                                      onClick={() => handleSetRating(rating)}
                                    >
                                      <Star 
                                        className={cn(
                                          "h-8 w-8", 
                                          rating <= selectedRating ? "fill-current" : ""
                                        )} 
                                      />
                                    </button>
                                  ))}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="review"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-cinzel">Your Review (Optional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Share your thoughts about this story..." 
                                  className="h-32 border-amber-500/50 focus:border-amber-500"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <DialogFooter>
                          <Button 
                            type="submit" 
                            className="bg-amber-500 hover:bg-amber-600 text-white"
                            disabled={ratingMutation.isPending || selectedRating === 0}
                          >
                            Submit Rating
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
          
          <Separator className="my-8 bg-amber-500/30" />
          
          {/* Content Display - Stories use Reader, Comics use PDF Viewer */}
          <div className="flex flex-col-reverse lg:flex-row gap-8">
            <div className="lg:w-3/4">
              {story?.contentType === 'comic' ? (
                /* Comic PDF Viewer */
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="font-cinzel text-2xl font-bold text-brown-dark mb-4">
                    {story.title}
                  </h2>
                  <div className="mb-4">
                    <p className="text-gray-600 mb-2">
                      <strong>Author:</strong> {story.author?.fullName || "Unknown Author"}
                    </p>
                    {story.description && (
                      <p className="text-gray-700 mb-4">{story.description}</p>
                    )}
                  </div>
                  {story.pdf_url ? (
                    <OriginalPdfViewer 
                      title={story.title}
                      author={story.author?.fullName || "Unknown Author"}
                      pdfUrl={story.pdf_url} 
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No PDF available for this comic.
                    </div>
                  )}
                </div>
              ) : (
                /* Story Reader Component */
                <Reader 
                  title={story.title}
                  author={story.author?.fullName || "Unknown Author"}
                  content={getStoryContent()}
                  storyId={story.id}
                  isBookmarked={isBookmarked}
                  onBookmark={handleBookmark}
                />
              )}
            </div>
            
            <div className="lg:w-1/4">
              <div className="sticky top-4">
                <Card className="border-amber-500/30 shadow-sm bg-amber-50/60 mb-6">
                  <CardContent className="p-4">
                    <h3 className="font-cinzel text-lg font-bold text-brown-dark mb-3">Reader Reviews</h3>
                    
                    {ratings && ratings.length > 0 ? (
                      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {ratings.slice(0, 5).map((rating) => (
                          <div key={rating.id} className="pb-3 border-b border-amber-500/20 last:border-0">
                            <div className="flex justify-between items-start mb-1">
                              <div className="flex items-center">
                                <img 
                                  src={rating.user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"} 
                                  className="w-7 h-7 rounded-full object-cover" 
                                  alt={`${rating.user?.fullName}'s avatar`} 
                                />
                                <span className="ml-2 text-sm font-medium text-brown-dark">
                                  {rating.user?.fullName}
                                </span>
                              </div>
                              <div className="flex text-amber-500">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={cn(
                                      "h-3 w-3", 
                                      i < rating.rating ? "fill-current" : ""
                                    )} 
                                  />
                                ))}
                              </div>
                            </div>
                            {rating.review && (
                              <p className="text-sm text-gray-600 mt-1">
                                {rating.review}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(rating.createdAt)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-white/70 italic">
                        No reviews yet. Be the first to review this story!
                      </p>
                    )}
                    
                    {ratings && ratings.length > 5 && (
                      <Button 
                        variant="link" 
                        className="text-amber-500 hover:text-amber-700 p-0 h-auto mt-2"
                      >
                        View all {ratings.length} reviews
                      </Button>
                    )}
                  </CardContent>
                </Card>
                
                {story && (
                  <div className="mb-4 text-center">
                        <Button asChild className="bg-amber-600 hover:bg-amber-700 text-white">
                          <Link href={`/listen/${story.id}`}>Listen</Link>
                        </Button>
                  </div>
                )}
                
                {story.author && (
                  <Card className="border-amber-500/30 shadow-sm bg-amber-50/60">
                    <CardContent className="p-4">
                      <h3 className="font-cinzel text-lg font-bold text-brown-dark mb-3">About the Author</h3>
                      
                      <Link href={`/author/${story.author.id}`}>
                        <div className="flex items-center group mb-3">
                          <img 
                            src={story.author.avatar_url || story.author.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"} 
                            className="w-12 h-12 rounded-full object-cover" 
                            alt={`${story.author.fullName}'s avatar`} 
                          />
                          <div className="ml-3">
                            <span className="block text-white font-medium drop-shadow-sm group-hover:text-amber-300">
                              {story.author.fullName}
                            </span>
                            <span className="text-sm text-white/70">
                              Author
                            </span>
                          </div>
                        </div>
                      </Link>
                      
                      {story.author.bio ? (
                        <p className="text-sm text-gray-600 mb-4">
                          {story.author.bio.length > 150 
                            ? `${story.author.bio.substring(0, 150)}...` 
                            : story.author.bio}
                        </p>
                      ) : (
                        <p className="text-sm text-white/70 italic mb-4">
                          This author hasn't added a bio yet.
                        </p>
                      )}
                      
                      <Button 
                        asChild
                        variant="outline" 
                        className="w-full border-amber-500 text-brown-dark hover:bg-amber-500 hover:text-white"
                      >
                        <Link href={`/author/${story.author.id}`}>
                          View Profile
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
          {isAdmin && (
            <div className="mt-6 p-4 border rounded-lg bg-muted/20">
              <h3 className="text-lg font-semibold mb-4">Admin Controls</h3>
              <p className="text-sm text-muted-foreground">Story editor has been moved to a separate project.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
