import { Link } from "wouter";
import { StoryCard as StoryCardType } from "@/lib/types";
import { Star, Bookmark, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, truncateText, formatDate } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

type StoryVariant = 'horizontal' | 'vertical' | 'compact';

interface StoryCardProps {
  story: StoryCardType;
  isBookmarked?: boolean;
  isNovel?: boolean;
  isPurchased?: boolean;
  variant?: StoryVariant;
  showActionButton?: boolean;
}

export default function StoryCard({ 
  story, 
  isBookmarked = false, 
  isNovel = false,
  isPurchased = false,
  variant = "vertical" as StoryVariant,
  showActionButton = true
}: StoryCardProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  
  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (bookmarked) {
        const res = await apiRequest("DELETE", `/api/stories/${story.id}/bookmark`, {});
        return res.json();
      } else {
        const res = await apiRequest("POST", `/api/stories/${story.id}/bookmark`, {});
        return res.json();
      }
    },
    onSuccess: () => {
      setBookmarked(!bookmarked);
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      toast({
        title: bookmarked ? "Removed from library" : "Added to library",
        description: bookmarked 
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
  
  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
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
  
  if (variant === "horizontal") {
    return (
      <div className="story-card bg-amber-50 rounded-lg shadow-md overflow-hidden flex flex-col md:flex-row">
        <Link 
          href={`/story/${story.id}`} 
          className="block md:w-1/3 hover:opacity-90 transition-opacity"
        >
          <img 
            src={story.coverImage || ""} 
            alt={`Cover for ${story.title}`} 
            className="w-full h-40 sm:h-48 md:h-full object-cover" 
            loading="lazy" 
            decoding="async" 
          />
        </Link>
        
        <div className="p-4 md:p-6 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <div className="flex flex-wrap gap-1">
              {story.genres.slice(0, 3).map((genre) => (
                <Link 
                  key={genre.id} 
                  href={`/genres/${genre.id}`}
                  className={cn(
                    "text-xs font-cinzel text-white px-2 py-1 rounded inline-block",
                    genre.id % 2 === 0 ? "bg-amber-500" : "bg-amber-800",
                    "hover:opacity-90 transition-opacity"
                  )}
                >
                  {genre.name}
                </Link>
              ))}
            </div>
            <div className="flex items-center text-amber-500">
              <Star className="h-4 w-4 fill-current" />
              <span className="ml-1 text-sm">{story.averageRating.toFixed(1)}</span>
            </div>
          </div>
          
          <Link href={`/story/${story.id}`}>
            <a className="hover:text-amber-700">
              <h3 className="font-cinzel text-xl font-bold mb-2">{story.title}</h3>
            </a>
          </Link>
          
          <p className="text-sm text-gray-600 mb-4 flex-grow">
            {truncateText(story.description, 180)}
          </p>
          
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center">
              <Link href={`/profile/${story.author?.id}`}>
                <a className="flex items-center group">
                  <img 
                    src={story.author?.avatarUrl || ""} 
                    className="w-8 h-8 rounded-full object-cover" 
                    alt={`${story.author?.fullName}'s avatar`} 
                  />
                  <div className="ml-2">
                    <span className="block text-sm font-medium group-hover:text-amber-700">
                      {story.author?.fullName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(story.createdAt)}
                    </span>
                  </div>
                </a>
              </Link>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "text-amber-500 hover:text-amber-700 transition-colors",
                  bookmarked && "text-amber-700 fill-current"
                )}
                onClick={handleBookmark}
                disabled={bookmarkMutation.isPending}
              >
                <Bookmark className="h-5 w-5" />
              </Button>
              
              {showActionButton && (
                <Button asChild className="bg-amber-800 hover:bg-amber-500 text-white">
                  <Link 
                    href={`/story/${story.id}`}
                    className="text-amber-900 hover:text-amber-700 font-medium inline-flex items-center"
                  >
                    Read {isNovel ? 'Novel' : 'Story'}
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (variant === "compact") {
    return (
      <div className="story-card flex items-center gap-3 p-3 bg-amber-50/50 rounded-lg hover:bg-amber-50 transition-colors">
        <Link 
          href={`/story/${story.id}`}
          className="block flex-shrink-0"
        >
          <img 
            src={story.coverImage || ""} 
            alt={`Cover for ${story.title}`} 
            className="w-12 h-12 object-cover rounded" 
            loading="lazy" 
            decoding="async" 
          />
        </Link>
        
        <div className="flex-1 min-w-0">
          <Link 
            href={`/story/${story.id}`}
            className="hover:text-amber-700 block"
          >
            <h3 className="font-cinzel font-bold text-sm truncate">{story.title}</h3>
          </Link>
          
          <div className="flex items-center text-xs text-gray-500">
            <span>{story.author?.fullName}</span>
            <span className="mx-1">•</span>
            <div className="flex items-center text-amber-500">
              <Star className="h-3 w-3 fill-current" />
              <span className="ml-0.5">{story.averageRating.toFixed(1)}</span>
            </div>
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn(
            "text-amber-500 hover:text-amber-700 transition-colors flex-shrink-0 h-8 w-8",
            bookmarked && "text-amber-700 fill-current"
          )}
          onClick={handleBookmark}
          disabled={bookmarkMutation.isPending}
        >
          <Bookmark className="h-4 w-4" />
        </Button>
      </div>
    );
  }
  
  // Base classes
  const baseContainerClasses = "story-card bg-amber-50 rounded-lg shadow-md overflow-hidden flex flex-col h-full";
  const baseImageClasses = "w-full object-cover transition-transform duration-300 group-hover:scale-105";

  // Determine variant-specific classes
  const variantClasses = (() => {
    switch (variant as StoryVariant) {
      case 'compact':
        return {
          container: 'max-w-xs',
          image: 'h-32'
        };
      case 'horizontal':
      case 'vertical':
      default:
        return {
          container: 'max-w-sm',
          image: 'h-48 sm:h-56'
        };
    }
  })();

  return (
    <div className={cn(baseContainerClasses, variantClasses.container)}>
      <Link 
        href={`/story/${story.id}`} 
        className="block relative group"
      >
        <img 
          src={story.coverImage || ""} 
          alt={`Cover for ${story.title}`} 
          className={cn(baseImageClasses, variantClasses.image)}
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
      </Link>
      
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-wrap gap-1">
            {story.genres.slice(0, 2).map((genre) => (
              <Link 
                key={genre.id} 
                href={`/genres/${genre.id}`}
                className={cn(
                  "text-xs font-cinzel text-white px-2 py-1 rounded",
                  genre.id % 2 === 0 ? "bg-amber-500" : "bg-amber-800"
                )}
              >
                {genre.name}
              </Link>
            ))}
          </div>
          <div className="flex items-center text-amber-500">
            <Star className="h-4 w-4 fill-current" />
            <span className="ml-1 text-sm">{story.averageRating.toFixed(1)}</span>
          </div>
        </div>
        
        <Link 
          href={`/story/${story.id}`}
          className="hover:text-amber-700 block mb-1"
        >
          <h3 className="font-cinzel text-lg font-bold">{story.title}</h3>
        </Link>
        
        <p className="text-sm text-gray-600 mb-4 flex-grow">
          {truncateText(story.description, 100)}
        </p>
        
        <div className="flex justify-between items-center mt-auto">
          <Link 
            href={`/profile/${story.author?.id}`}
            className="flex items-center group"
          >
            <img 
              src={story.author?.avatarUrl || ""} 
              className="w-8 h-8 rounded-full object-cover" 
              alt={`${story.author?.fullName}'s avatar`} 
            />
            <span className="ml-2 text-sm font-medium group-hover:text-amber-700">
              {story.author?.fullName}
            </span>
          </Link>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "text-amber-500 hover:text-amber-700 transition-colors",
              bookmarked && "text-amber-700 fill-current"
            )}
            onClick={handleBookmark}
            disabled={bookmarkMutation.isPending}
          >
            <Bookmark className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
