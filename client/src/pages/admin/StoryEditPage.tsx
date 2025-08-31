import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'wouter';
import { useStories } from '@/context/StoriesContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAdmin } from '@/context/AdminContext';

interface FormData {
  title: string;
  description: string;
  coverUrl: string;
  posterUrl: string;
  isPublished: boolean;
}

export default function StoryEditPage() {
  const { id } = useParams<{ id: string }>();
  const storyId = parseInt(id, 10);

  const { getStory, updateStory } = useStories();
  const { canPublish } = useAdmin();
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    coverUrl: '',
    posterUrl: '',
    isPublished: false,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const story = getStory(storyId);
    if (story) {
      setFormData({
        title: story.title,
        description: story.description,
        coverUrl: story.coverUrl,
        posterUrl: story.posterUrl || '',
        isPublished: story.isPublished || false,
      });
    } else {
      // Handle story not found
      window.location.href = '/admin/stories';
    }
    setIsLoading(false);
  }, [getStory, storyId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;
    
    setIsSubmitting(true);
    try {
      await updateStory(storyId, {
        title: formData.title,
        description: formData.description,
        coverUrl: formData.coverUrl || '/placeholder-cover.jpg',
        posterUrl: formData.posterUrl || formData.coverUrl || '/placeholder-poster.jpg',
        isPublished: formData.isPublished,
      });
      
      window.location.href = '/admin/stories';
    } catch (error) {
      console.error('Error updating story:', error);
      setIsSubmitting(false);
    }
  };

  const togglePublishStatus = async () => {
    try {
      await updateStory(storyId, {
        isPublished: !formData.isPublished,
      });
      
      setFormData(prev => ({
        ...prev,
        isPublished: !prev.isPublished
      }));
    } catch (error) {
      console.error('Error toggling publish status:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit Story</h1>
        <div className="flex space-x-2">
          <Button 
            variant={formData.isPublished ? "outline" : "default"}
            onClick={togglePublishStatus}
            disabled={!canPublish || isSubmitting}
            type="button"
          >
            {formData.isPublished ? 'Unpublish' : 'Publish'}
          </Button>
          <Link href="/admin/stories">
            <Button variant="outline">
              Back to Stories
            </Button>
          </Link>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <Input
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Story title"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <Textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
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
              name="coverUrl"
              value={formData.coverUrl}
              onChange={handleChange}
              placeholder="https://example.com/cover.jpg"
            />
            {formData.coverUrl && (
              <div className="mt-2">
                <img 
                  src={formData.coverUrl} 
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
              name="posterUrl"
              value={formData.posterUrl}
              onChange={handleChange}
              placeholder="https://example.com/poster.jpg"
            />
            {(formData.posterUrl || formData.coverUrl) && (
              <div className="mt-2">
                <img 
                  src={formData.posterUrl || formData.coverUrl} 
                  alt="Poster preview" 
                  className="h-48 w-full object-cover rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = formData.posterUrl || formData.coverUrl || '/placeholder-poster.jpg';
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
            disabled={!formData.title || !formData.description || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
