import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, BookOpen, Download } from "lucide-react";
import { useAuth } from "@/lib/auth";
// import ReactMarkdown from "react-markdown"; // TODO: Install react-markdown package

interface Chapter {
  id: number;
  title: string;
  content: string;
  file_url: string;
  file_type: string;
  order: number;
}

interface Story {
  id: number;
  title: string;
  publish_at?: string;
  author: {
    username: string;
    fullName: string;
  };
}


export default function ChapterReaderPage() {
  const { storyId, chapterId } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [fontSize, setFontSize] = useState(16);

  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const { data: versions } = useQuery<{ id: string; created_at: string }[]>({
    queryKey: ["chapter-versions", chapterId],
    queryFn: async () => {
      const res = await fetch(`/api/chapters/${chapterId}/versions`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!chapterId
  });

  const { data: chapter, isLoading: chapterLoading } = useQuery<Chapter>({
    queryKey: ["chapter", storyId, chapterId],
    queryFn: async () => {
      const response = await fetch(`/api/stories/${storyId}/chapters/${chapterId}`, {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {}
      });
      if (!response.ok) throw new Error("Failed to fetch chapter");
      return response.json();
    },
    enabled: !!(storyId && chapterId)
  });

  const { data: story, isLoading: storyLoading } = useQuery<Story>({
    queryKey: ["story-basic", storyId],
    queryFn: async () => {
      const response = await fetch(`/api/stories/${storyId}/basic`, {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {}
      });
      if (!response.ok) throw new Error("Failed to fetch story");
      return response.json();
    },
    enabled: !!storyId
  });

  const { data: navigation } = useQuery({
    queryKey: ["chapter-navigation", storyId, chapterId],
    queryFn: async () => {
      const response = await fetch(`/api/stories/${storyId}/chapters/${chapterId}/navigation`, {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {}
      });
      if (!response.ok) return { prev: null, next: null };
      return response.json();
    },
    enabled: !!(storyId && chapterId)
  });

  if (chapterLoading || storyLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-10">
        <div className="animate-pulse space-y-6">
          <div className="w-1/3 h-8 bg-gray-200 rounded"></div>
          <div className="w-full h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!chapter || !story) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-10 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Chapter Not Found</h1>
        <p className="text-gray-600 mb-6">The chapter you're looking for doesn't exist.</p>
        <Button onClick={() => navigate(`/story/${storyId}/chapters`)}>Back to Chapters</Button>
      </div>
    );
  }

  const handlePrevChapter = () => {
    if (navigation?.prev) {
      navigate(`/story/${storyId}/chapter/${navigation.prev.id}`);
    }
  };

  const handleNextChapter = () => {
    if (navigation?.next) {
      navigate(`/story/${storyId}/chapter/${navigation.next.id}`);
    }
  };

  const renderContent = () => {
    if (chapter.file_type === 'pdf') {
      return (
        <div className="w-full h-screen">
          <embed
            src={chapter.file_url}
            type="application/pdf"
            width="100%"
            height="100%"
            className="rounded-lg"
          />
          <div className="mt-4 text-center">
            <Button asChild variant="outline">
              <a href={chapter.file_url} download target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </a>
            </Button>
          </div>
        </div>
      );
    }

    if (chapter.file_type.startsWith('image')) {
      return (
        <div className="w-full text-center">
          <img src={chapter.file_url} alt={chapter.title} className="mx-auto max-w-full rounded-lg" />
          <div className="mt-4">
            <Button asChild variant="outline">
              <a href={chapter.file_url} download target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Download Image
              </a>
            </Button>
          </div>
        </div>
      );
    }

    if (chapter.file_type.startsWith('audio')) {
      return (
        <div className="w-full text-center space-y-4">
          <audio controls src={chapter.file_url} className="w-full max-w-md mx-auto" />
          <div>
            <Button asChild variant="outline">
              <a href={chapter.file_url} download target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Download Audio
              </a>
            </Button>
          </div>
        </div>
      );
    }

    // Text/Markdown content
    return (
      <div 
        className="prose prose-lg max-w-none"
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.7 }}
      >
        {chapter.file_type === 'markdown' ? (
          <div className="whitespace-pre-wrap font-serif" dangerouslySetInnerHTML={{ __html: chapter.content }} />
        ) : (
          <div className="whitespace-pre-wrap font-serif">
            {chapter.content}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>{chapter.title} - {story.title} | NovelNexus</title>
      </Helmet>

      <div className="bg-gradient-to-b from-amber-500/10 to-amber-50/10 min-h-screen">
        {/* Header */}
        <div className="bg-white shadow-sm sticky top-0 z-10">
          <div className="container mx-auto max-w-4xl px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {story.publish_at && new Date(story.publish_at).getTime() > Date.now() && (
                  <Badge variant="outline" className="text-amber-700 border-amber-500">Scheduled ⏰</Badge>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/story/${storyId}/chapters`)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Chapters
                </Button>
                <div>
                  <h1 className="font-semibold text-lg">{chapter.title}</h1>
                  <p className="text-sm text-gray-600">
                    {story.title} by {story.author.fullName || story.author.username}
                  </p>
                </div>
              </div>

              {/* Reading Controls */}
              {chapter.file_type !== 'pdf' && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                  >
                    A-
                  </Button>
                  <span className="text-sm px-2">{fontSize}px</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                  >
                    A+
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {versions && versions.length > 1 && (
            <div className="mb-4 flex gap-2 items-center">
              <Label>Version:</Label>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={selectedVersion || versions[0].id}
                onChange={async (e) => {
                  const id = e.target.value;
                  setSelectedVersion(id);
                  const res = await fetch(`/api/chapters/${chapterId}/versions/${id}`);
                  if (res.ok) {
                    const ver = await res.json();
                    navigate(`/story/${storyId}/chapter/${chapterId}?version=${id}`, { replace: true });
                    // simplistic: reload page
                    window.location.reload();
                  }
                }}
              >
                {versions.map((v, idx) => (
                  <option key={v.id} value={v.id}>v{versions.length - idx}</option>
                ))}
              </select>
            </div>
          )}

          {/* Content */}
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <Card>
            <CardContent className="p-8">
              {renderContent()}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8">
            <Button
              variant="outline"
              onClick={handlePrevChapter}
              disabled={!navigation?.prev}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {navigation?.prev ? `Previous: ${navigation.prev.title}` : 'Previous Chapter'}
            </Button>

            <Button
              onClick={() => navigate(`/story/${storyId}/chapters`)}
              variant="outline"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              All Chapters
            </Button>

            <Button
              onClick={handleNextChapter}
              disabled={!navigation?.next}
              className="flex items-center gap-2"
            >
              {navigation?.next ? `Next: ${navigation.next.title}` : 'Next Chapter'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
