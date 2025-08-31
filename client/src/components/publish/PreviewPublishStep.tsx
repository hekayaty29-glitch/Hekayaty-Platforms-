import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, BookOpen, User, FileText, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

interface PreviewPublishStepProps {
  data: {
    title: string;
    description: string;
    coverImage: string;
    genre: string[];
    authorName: string;
    collaborators: { id: string | number; fullName: string }[];
    placement?: string;
    chapters: {
      id: string;
      name: string;
      file: File;
      order: number;
    }[];
  };
  onUpdate: (updates: any) => void;
  onPrevious: () => void;
  user: any;
}

export default function PreviewPublishStep({ data, onUpdate, onPrevious, user }: PreviewPublishStepProps) {
  const [isPremium, setIsPremium] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [publishAt, setPublishAt] = useState<string>("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [, navigate] = useLocation();

  const handlePublish = async () => {
    setIsPublishing(true);
    // Get current access token
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      alert("Authentication error. Please login again.");
      setIsPublishing(false);
      return;
    }
    
    try {
      // Validate scheduled datetime
      if (scheduleEnabled) {
        if (!publishAt) throw new Error("Please select a publish date & time");
        const selectedDate = new Date(publishAt);
        if (selectedDate.getTime() < Date.now()) {
          throw new Error("Publish date must be in the future");
        }
      }
      // First, create the story
      const storyPayload = {
        title: data.title,
        description: data.description,
        coverImage: data.coverImage,
        placement: data.placement,
        authorName: data.authorName,
        genre: data.genre,
        collaborators: data.collaborators,
        isPremium,
        isPublished: false // Will be set to true after chapters upload
      };

      const { getEdgeFunctionUrl, EDGE_FUNCTIONS } = await import('../../lib/api-config');
      const response = await fetch(getEdgeFunctionUrl(EDGE_FUNCTIONS.STORIES_CREATE), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(storyPayload)
      });

      if (!response.ok) {
        throw new Error('Failed to create story');
      }

      const { storyId } = await response.json();

      // Upload chapters
      const formData = new FormData();
      data.chapters.forEach((chapter, index) => {
        formData.append(`chapters`, chapter.file);
        formData.append(`chapterNames`, chapter.name);
        formData.append(`chapterOrders`, index.toString());
      });

      const chaptersResponse = await fetch(`/api/stories/${storyId}/chapters`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!chaptersResponse.ok) {
        throw new Error('Failed to upload chapters');
      }

      // Publish the story
      const publishPayload = scheduleEnabled ? { publish_at: publishAt } : {};

      const publishResponse = await fetch(`/api/stories/${storyId}/publish`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(publishPayload)
      });

      if (!publishResponse.ok) {
        throw new Error('Failed to publish story');
      }

      // Navigate to the published story
      navigate(`/story/${storyId}`);
      
    } catch (error) {
      console.error('Publishing error:', error);
      alert('Failed to publish story. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalSize = data.chapters.reduce((total, chapter) => total + chapter.file.size, 0);

  return (
    <div className="space-y-6">
      {/* Story Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Story Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6">
            {/* Cover Image */}
            <div className="flex-shrink-0">
              {data.coverImage ? (
                <img 
                  src={data.coverImage} 
                  alt="Story cover" 
                  className="w-32 h-44 object-cover rounded-lg shadow-md"
                />
              ) : (
                <div className="w-32 h-44 bg-gray-200 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>

            {/* Story Details */}
            <div className="flex-1 space-y-3">
              <h3 className="text-xl font-bold">{data.title}</h3>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>by {data.authorName}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {data.genre.map((genre) => (
                  <Badge key={genre} variant="secondary">{genre}</Badge>
                ))}
              </div>

              {/* Publication Page */}
              {data.placement && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-gray-600 mr-2">Publishing to:</span>
                  <Badge variant="default" className="bg-amber-600">{data.placement}</Badge>
                </div>
              )}

              <p className="text-gray-700 leading-relaxed">
                {data.description}
              </p>

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{data.chapters.length} chapters</span>
                <span>Total size: {formatFileSize(totalSize)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chapters Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Chapters ({data.chapters.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {data.chapters.map((chapter, index) => (
              <div key={chapter.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500">
                    {index + 1}.
                  </span>
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">{chapter.name}</span>
                </div>
                <span className="text-sm text-gray-500">
                  {formatFileSize(chapter.file.size)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Publishing Options */}
      <Card>
        <CardHeader>
          <CardTitle>Publishing Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Premium toggle */}
          {user?.isPremium && (
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="premium" 
                checked={isPremium}
                onCheckedChange={(checked) => setIsPremium(checked === true)}
              />
              <label htmlFor="premium" className="text-sm font-medium">
                Mark as Premium Content
              </label>
            </div>
          )}

          {/* Scheduled publishing */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="schedule"
                checked={scheduleEnabled}
                onCheckedChange={(checked) => setScheduleEnabled(checked === true)}
              />
              <label htmlFor="schedule" className="text-sm font-medium">
                Schedule Publication
              </label>
            </div>
            {scheduleEnabled && (
              <input
                type="datetime-local"
                value={publishAt}
                onChange={(e) => setPublishAt(e.target.value)}
                className="border rounded px-3 py-2 text-sm"
                min={new Date().toISOString().slice(0,16)}
              />
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium text-amber-800 mb-2">Publishing Guidelines</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Your story will be reviewed before appearing publicly</li>
              <li>• Ensure content follows community guidelines</li>
              <li>• You can edit chapters after publishing</li>
              <li>• Readers will be able to rate and comment on your story</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrevious} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button 
          onClick={handlePublish} 
          disabled={isPublishing}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
        >
          {isPublishing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Publishing...
            </>
          ) : (
            <>
              <BookOpen className="h-4 w-4" />
              Publish Story
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
