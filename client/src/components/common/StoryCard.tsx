import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Clock, Trash2 } from "lucide-react";
import { formatDate, calculateReadTime } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface StoryCardProps {
  story: {
    id: string;
    title: string;
    description: string;
    coverImage?: string;
    cover_url?: string;
    author: {
      id: string;
      fullName: string;
      avatarUrl?: string;
    };
    author_id?: string;
    genres?: { id: number; name: string }[];
    averageRating: number;
    ratingCount: number;
    createdAt: string;
    content?: string;
    isPremium?: boolean;
    isShortStory?: boolean;
  };
  showAuthor?: boolean;
  className?: string;
  onDelete?: () => void;
}

export default function StoryCard({ story, showAuthor = true, className = "", onDelete }: StoryCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const readTime = story.content ? calculateReadTime(story.content) : 0;

  // Check if current user is the author
  const isOwner = user && (
    story.author_id?.toString() === user.id?.toString() || 
    story.author.id?.toString() === user.id?.toString()
  );

  const deleteStoryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/stories/${story.id}`);
      if (!response.ok) {
        throw new Error('Failed to delete story');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Story deleted",
        description: "Your story has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      onDelete?.();
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to delete story. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    deleteStoryMutation.mutate();
  };

  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 border-amber-500/30 bg-amber-50/60 ${className}`}>
      <CardContent className="p-0">
        <Link href={`/story/${story.id}`}>
          <div className="cursor-pointer">
            {/* Cover Image */}
            <div className="relative overflow-hidden rounded-t-lg">
              <img
                src={story.cover_url || story.coverImage || "https://images.unsplash.com/photo-1589998059171-988d887df646?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"}
                alt={`Cover for ${story.title}`}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {story.isPremium && (
                <Badge className="absolute top-2 right-2 bg-gold-rich text-white">
                  Premium
                </Badge>
              )}
              {story.isShortStory && (
                <Badge className="absolute top-2 left-2 bg-amber-600 text-white">
                  Short Story
                </Badge>
              )}
              {/* Delete button for story owners */}
              {isOwner && (
                <div className="absolute bottom-2 right-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 w-8 p-0 bg-red-500/80 hover:bg-red-600 backdrop-blur-sm"
                        onClick={(e) => e.preventDefault()}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Story</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{story.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={deleteStoryMutation.isPending}
                        >
                          {deleteStoryMutation.isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Genres */}
              {story.genres && story.genres.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {story.genres.slice(0, 2).map((genre) => (
                    <Badge key={genre.id} variant="secondary" className="text-xs">
                      {genre.name}
                    </Badge>
                  ))}
                  {story.genres.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{story.genres.length - 2}
                    </Badge>
                  )}
                </div>
              )}

              {/* Title */}
              <h3 className="font-cinzel text-lg font-bold text-brown-dark mb-2 line-clamp-2 group-hover:text-amber-700 transition-colors">
                {story.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {story.description}
              </p>

              {/* Author */}
              {showAuthor && story.author && (
                <div className="flex items-center mb-3">
                  <img
                    src={story.author.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"}
                    alt={`${story.author.fullName}'s avatar`}
                    className="w-6 h-6 rounded-full object-cover mr-2"
                  />
                  <span className="text-sm text-gray-700 font-medium">
                    {story.author.fullName}
                  </span>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-3">
                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span>{(story.averageRating || 0).toFixed(1)}</span>
                    <span>({story.ratingCount || 0})</span>
                  </div>

                  {/* Read Time */}
                  {readTime > 0 && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{readTime} min</span>
                    </div>
                  )}
                </div>

                {/* Published Date */}
                <span>{formatDate(story.createdAt)}</span>
              </div>

              {/* Delete Button for Owner */}
              {isOwner && (
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Story</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{story.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDelete();
                          }}
                          disabled={deleteStoryMutation.isPending}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {deleteStoryMutation.isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}
