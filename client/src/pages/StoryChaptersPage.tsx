import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, User, Clock, FileText, File } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface Chapter {
  id: number;
  title: string;
  order: number;
  file_url: string;
  file_type: string;
  created_at: string;
}

interface Story {
  id: number;
  title: string;
  description: string;
  cover_image: string;
  author: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string;
  };
  genres: string[];
  chapters: Chapter[];
  avgRating: number;
  isBookmarked: boolean;
}

export default function StoryChaptersPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const { data: story, isLoading, error } = useQuery<Story>({
    queryKey: ["story", id],
    queryFn: async () => {
      const response = await fetch(`/api/stories/${id}`, {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {}
      });
      if (!response.ok) throw new Error("Failed to fetch story");
      return response.json();
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-10">
        <div className="animate-pulse space-y-6">
          <div className="flex gap-6">
            <div className="w-48 h-64 bg-gray-200 rounded-lg"></div>
            <div className="flex-1 space-y-4">
              <div className="w-3/4 h-8 bg-gray-200 rounded"></div>
              <div className="w-1/2 h-4 bg-gray-200 rounded"></div>
              <div className="w-full h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-full h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-10 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Story Not Found</h1>
        <p className="text-gray-600 mb-6">The story you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }

  const handleChapterClick = (chapter: Chapter) => {
    navigate(`/story/${id}/chapter/${chapter.id}`);
  };

  const getFileIcon = (fileType: string) => {
    return fileType === 'pdf' ? 
      <File className="h-5 w-5 text-red-500" /> : 
      <FileText className="h-5 w-5 text-blue-500" />;
  };

  return (
    <>
      <Helmet>
        <title>{story.title} - Chapters | NovelNexus</title>
        <meta name="description" content={story.description} />
      </Helmet>

      <div className="bg-gradient-to-b from-amber-500/10 to-amber-50/10 min-h-screen pt-8 pb-16">
        <div className="container mx-auto max-w-4xl px-4">
          {/* Story Header */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex gap-6">
                {/* Cover Image */}
                <div className="flex-shrink-0">
                  {story.cover_image ? (
                    <img 
                      src={story.cover_image} 
                      alt={story.title}
                      className="w-48 h-64 object-cover rounded-lg shadow-md"
                    />
                  ) : (
                    <div className="w-48 h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Story Details */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">{story.title}</h1>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>by {story.author.fullName || story.author.username}</span>
                      </div>
                      {story.avgRating > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span>{story.avgRating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {story.genres.map((genre) => (
                        <Badge key={genre} variant="secondary">{genre}</Badge>
                      ))}
                    </div>

                    <p className="text-gray-700 leading-relaxed mb-6">
                      {story.description}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{story.chapters?.length || 0} chapters</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chapters List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Chapters ({story.chapters?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {story.chapters && story.chapters.length > 0 ? (
                <div className="space-y-3">
                  {story.chapters.map((chapter, index) => (
                    <div
                      key={chapter.id}
                      className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                      onClick={() => handleChapterClick(chapter)}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-semibold text-gray-500 min-w-[2rem]">
                          {index + 1}.
                        </span>
                        {getFileIcon(chapter.file_type)}
                        <div>
                          <h3 className="font-medium text-gray-800">{chapter.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(chapter.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Read
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No chapters available</h3>
                  <p className="text-gray-500">This story hasn't been published yet or chapters are being processed.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
