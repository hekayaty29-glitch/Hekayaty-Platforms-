import React from 'react';
import { useStories } from '@/context/StoriesContext';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Eye, EyeOff, Upload } from 'lucide-react';
import { Link } from 'wouter';
import { useAdmin } from '@/context/AdminContext';

export default function StoryManagerPage() {
  const { stories, updateStory, deleteStory } = useStories();
  const { canEdit, canPublish } = useAdmin();

  const togglePublishStatus = async (story: any) => {
    try {
      await updateStory(story.id, { ...story, isPublished: !story.isPublished });
    } catch (error) {
      console.error('Error updating story status:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this story? This action cannot be undone.')) {
      try {
        await deleteStory(id);
      } catch (error) {
        console.error('Error deleting story:', error);
      }
    }
  };

  if (!canEdit) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Story Manager</h1>
        <Button asChild>
          <Link href="/admin/stories/new">Add New Story</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stories.map((story) => (
          <div key={story.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="relative">
              <img 
                src={story.coverUrl || '/placeholder-cover.jpg'} 
                alt={story.title}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-cover.jpg';
                }}
              />
              {!story.isPublished && (
                <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                  Draft
                </div>
              )}
            </div>
            
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-1 line-clamp-1">{story.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                {story.description}
              </p>
              
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/stories/${story.id}/edit`}>
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Link>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => togglePublishStatus(story)}
                    disabled={!canPublish}
                  >
                    {story.isPublished ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-1" />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-1" />
                        Publish
                      </>
                    )}
                  </Button>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:bg-red-50 hover:text-red-600"
                  onClick={() => handleDelete(story.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
