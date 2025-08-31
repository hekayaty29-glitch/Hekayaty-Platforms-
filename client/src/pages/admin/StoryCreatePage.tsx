import React from 'react';
import { Link } from 'wouter';
import { useStories } from '@/context/StoriesContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAdmin } from '@/context/AdminContext';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function StoryCreatePage() {
  const { addStory, canCreateStory } = useStories();
  const { canPublish, isAdmin, currentUserId } = useAdmin();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storyLimit, setStoryLimit] = useState<{ canCreate: boolean; remaining: number } | null>(null);

  // Check story limit when component mounts
  useEffect(() => {
    if (!isAdmin && currentUserId) {
      const limit = canCreateStory();
      setStoryLimit(limit);
      
      if (!limit.canCreate) {
        setError(`You have reached the maximum limit of 5 stories. Please delete some stories before creating new ones.`);
      }
    } else if (isAdmin) {
      // For admins, we don't need to check limits
      setStoryLimit({ canCreate: true, remaining: Infinity });
    }
  }, [canCreateStory, isAdmin, currentUserId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    
    // Double check story limit for non-admin users
    if (!isAdmin && storyLimit && !storyLimit.canCreate) {
      setError(`You have reached the maximum limit of 5 stories. Please delete some stories before creating new ones.`);
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await addStory({
        title,
        description,
        coverUrl: coverUrl || '/placeholder-cover.jpg',
        posterUrl: posterUrl || coverUrl || '/placeholder-poster.jpg',
        extraPhotos: [],
        genres: [],
        isPublished: canPublish,
      });
      
      window.location.href = '/admin/stories';
    } catch (error) {
      console.error('Error creating story:', error);
      setError(error instanceof Error ? error.message : 'Failed to create story');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Create New Story</h1>
        <Link href="/admin/stories">
          <Button variant="outline">
            Back to Stories
          </Button>
        </Link>
      </div>
      
      {error && (
        <Alert variant="default" className="mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {!isAdmin && storyLimit?.canCreate && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Story Limit</AlertTitle>
          <AlertDescription>
            You can create up to {storyLimit.remaining} more {storyLimit.remaining === 1 ? 'story' : 'stories'}.
          </AlertDescription>
        </Alert>
      )}
      
      <form 
        onSubmit={handleSubmit} 
        className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
      >
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Story title"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Story description or synopsis"
            rows={6}
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">Cover Image URL</label>
            <Input
              type="url"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://example.com/cover.jpg"
            />
            {coverUrl && (
              <div className="mt-2">
                <img 
                  src={coverUrl} 
                  alt="Cover preview" 
                  className="h-48 w-full object-cover rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-cover.jpg';
                  }}
                />
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Poster Image URL (Optional)</label>
            <Input
              type="url"
              value={posterUrl}
              onChange={(e) => setPosterUrl(e.target.value)}
              placeholder="https://example.com/poster.jpg"
            />
            {posterUrl && (
              <div className="mt-2">
                <img 
                  src={posterUrl} 
                  alt="Poster preview" 
                  className="h-48 w-full object-cover rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = posterUrl || '/placeholder-poster.jpg';
                  }}
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => { window.location.href = '/admin/stories'; }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || (!isAdmin && storyLimit && !storyLimit.canCreate) || !title || !description}
          >
            {isSubmitting ? 'Creating...' : 'Create Story'}
          </Button>
          {canPublish && (
            <Button 
              type="submit" 
              variant="default"
              disabled={!title || !description || isSubmitting}
              onClick={(e) => {
                e.preventDefault();
                handleSubmit(e);
              }}
            >
              {isSubmitting ? 'Publishing...' : 'Publish Now'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
