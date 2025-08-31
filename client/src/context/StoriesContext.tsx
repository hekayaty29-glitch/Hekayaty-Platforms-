import React, { useContext } from "react";
import { NewStory } from "@/components/story/StoryCreateForm";

export interface Story extends Omit<NewStory, 'id'> {
  id: number;
  userId: string;
  isPublished?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Maximum number of stories a regular user can create
const MAX_STORIES_PER_USER = 5;

interface StoriesContextType {
  stories: Story[];
  canCreateStory: () => { canCreate: boolean; remaining: number };
  addStory: (story: Omit<Story, 'id' | 'userId'>) => Promise<Story>;
  updateStory: (id: number, updates: Partial<Story>) => Promise<Story>;
  deleteStory: (id: number) => Promise<void>;
  getStory: (id: number) => Story | undefined;
}

export const StoriesContext = React.createContext<StoriesContextType | undefined>(undefined);

export function StoriesProvider({ children }: { children: React.ReactNode }) {
  const [stories, setStories] = React.useState<Story[]>([]);

  // Get the current user ID from your auth system
  const getCurrentUserId = (): string => {
    // In a real app, this would come from your auth context
    // For now, we'll use a mock user ID
    return 'current-user-id';
  };

  // Check if user can create more stories
  const canCreateStory = (userId: string): { canCreate: boolean; remaining: number } => {
    const userStories = stories.filter(story => story.userId === userId);
    const remaining = Math.max(0, MAX_STORIES_PER_USER - userStories.length);
    return {
      canCreate: remaining > 0,
      remaining
    };
  };

  const addStory = async (story: Omit<Story, 'id' | 'userId'>): Promise<Story> => {
    const userId = getCurrentUserId();
    
    // Check story limit for non-admin users
    const { canCreate, remaining } = canCreateStory(userId);
    if (!canCreate) {
      throw new Error(`You have reached the maximum limit of ${MAX_STORIES_PER_USER} stories. Please delete some stories before creating new ones.`);
    }

    const newStory: Story = {
      ...story,
      id: Date.now(),
      userId,
      isPublished: story.isPublished ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setStories(prev => [...prev, newStory]);
    return newStory;
  };

  const updateStory = async (id: number, updates: Partial<Story>): Promise<Story> => {
    return new Promise((resolve) => {
      setStories(prev => {
        const storyIndex = prev.findIndex(s => s.id === id);
        if (storyIndex === -1) {
          throw new Error(`Story with ID ${id} not found`);
        }
        
        const updatedStory = {
          ...prev[storyIndex],
          ...updates,
          updatedAt: new Date(),
        };
        
        const newStories = [...prev];
        newStories[storyIndex] = updatedStory;
        
        resolve(updatedStory);
        return newStories;
      });
    });
  };

  const deleteStory = async (id: number): Promise<void> => {
    setStories(prev => prev.filter(story => story.id !== id));
  };

  const getStory = (id: number): Story | undefined => {
    return stories.find(story => story.id === id);
  };

  const value = {
    stories,
    canCreateStory: () => canCreateStory(getCurrentUserId()),
    addStory,
    updateStory,
    deleteStory,
    getStory,
  };

  return (
    <StoriesContext.Provider value={value}>
      {children}
    </StoriesContext.Provider>
  );
}

export function useStories() {
  const context = useContext(StoriesContext);
  if (context === undefined) {
    throw new Error('useStories must be used within a StoriesProvider');
  }
  return context;
}
