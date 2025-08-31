import { supabase } from './supabase-auth';

export interface SupabaseUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  bio?: string;
  avatar_url?: string;
  is_premium: boolean;
  is_author: boolean;
  is_admin: boolean;
  role: string;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseStory {
  id: string;
  title: string;
  description: string;
  content: string;
  cover_url?: string;
  poster_url?: string;
  soundtrack_url?: string;
  extra_photos?: any;
  status?: string;
  author_id: string; // UUID as string - use database column name
  is_premium: boolean; // Use database column name
  is_published: boolean; // Use database column name
  is_short_story: boolean; // Use database column name
  placement?: string | null; 
  genre?: string[]; 
  created_at?: string; // Use database column name
  updated_at?: string; // Use database column name
}

export interface SupabaseComic {
  id: number;
  title: string;
  description: string;
  cover_url?: string;
  pdf_url?: string;
  author_id: string;
  workshop_id?: string;
  is_premium: boolean;
  is_published: boolean;
  genre?: string[];
  created_at: string;
  updated_at: string;
}

export interface TaleCraftProject {
  id: string;
  title: string;
  type: 'story' | 'comic' | 'photo';
  content: any;
  author_id: string;
  chapters?: any[];
  pages?: any[];
  last_modified: string;
  created_at: string;
  updated_at: string;
}

export class SupabaseStorage {
  // Comic methods
  async getComic(id: string): Promise<SupabaseComic | null> {
    const { data, error } = await supabase
      .from('comics')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Get comic error:', error);
      return null;
    }

    return data;
  }

  async deleteComic(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('comics')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete comic error:', error);
      return false;
    }

    return true;
  }

  // Chapter methods
  async createChapter(chapter: { story_id: string; title: string; file_url?: string; file_type?: 'pdf' | 'text' | 'audio' | 'image'; chapter_order: number; content?: string | null }): Promise<any | null> {
    const chapterData = {
      story_id: chapter.story_id,
      title: chapter.title,
      content: chapter.content,
      file_url: chapter.file_url,
      file_type: chapter.file_type || 'text',
      chapter_order: chapter.chapter_order
    };

    const { data, error } = await supabase
      .from('story_chapters')
      .insert(chapterData)
      .select()
      .single();

    if (error) {
      console.error('Create chapter error:', error);
      return null;
    }

    return data;
  }

  async getChapters(storyId: string): Promise<any[]> {
    console.log('Supabase getChapters called with storyId:', storyId);
    
    const { data, error } = await supabase
      .from('story_chapters')
      .select('*')
      .eq('story_id', storyId)
      .order('chapter_order');

    if (error) {
      console.error('Get chapters Supabase error:', error);
      return [];
    }

    console.log('Supabase chapters result:', data);
    return data || [];
  }

  async getAdjacentChapter(storyId: string, currentOrder: number, direction: 'prev' | 'next'): Promise<any | null> {
    const op = direction === 'prev' ? 'lt' : 'gt';
    const sort = direction === 'prev' ? { ascending: false } : { ascending: true };

    const { data, error } = await supabase
      .from('story_chapters')
      .select('*')
      .eq('story_id', storyId)
      .filter('chapter_order', op, currentOrder)
      .order('chapter_order', sort)
      .limit(1)
      .single();

    if (error) {
      console.error('Get adjacent chapter error:', error);
      return null;
    }

    return data;
  }
  // User methods
  async getUserProfile(id: string): Promise<SupabaseUser | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Get user profile error:', error);
      return null;
    }

    return data;
  }

  async getUserByUsername(username: string): Promise<SupabaseUser | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username.toLowerCase())
      .single();

    if (error) {
      console.error('Get user by username error:', error);
      return null;
    }

    return data;
  }

  async getUserByEmail(email: string): Promise<SupabaseUser | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Get user by email error:', error);
      return null;
    }

    return data;
  }

  async updateUserProfile(id: string, updates: Partial<SupabaseUser>): Promise<SupabaseUser | null> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update user profile error:', error);
      return null;
    }

    return data;
  }

  // Alias methods for compatibility
  async getUser(id: string): Promise<SupabaseUser | null> {
    return this.getUserProfile(id);
  }

  async updateUser(id: string, updates: any): Promise<SupabaseUser | null> {
    return this.updateUserProfile(id, updates);
  }

  async getAllGenres(): Promise<any[]> {
    // Return hardcoded genres for now
    return [
      { id: 1, name: 'Romance', slug: 'romance' },
      { id: 2, name: 'Mystery', slug: 'mystery' },
      { id: 3, name: 'Fantasy', slug: 'fantasy' },
      { id: 4, name: 'Science Fiction', slug: 'sci-fi' },
      { id: 5, name: 'Thriller', slug: 'thriller' },
      { id: 6, name: 'Horror', slug: 'horror' },
      { id: 7, name: 'Adventure', slug: 'adventure' },
      { id: 8, name: 'Drama', slug: 'drama' },
      { id: 9, name: 'Comedy', slug: 'comedy' },
      { id: 10, name: 'Historical Fiction', slug: 'historical' },
      { id: 11, name: 'Hekayaty Original', slug: 'hekayaty_original' }
    ];
  }

  async getGenre(id: number): Promise<any> {
    const genres = await this.getAllGenres();
    return genres.find(g => g.id === id) || null;
  }

  async getGenreBySlug(slug: string): Promise<any> {
    const genres = await this.getAllGenres();
    return genres.find(g => g.slug === slug) || null;
  }

  async getStoryGenres(storyId: string): Promise<any[]> {
    // For now, return empty array - in full implementation would join with story_genres table
    return [];
  }

  async addStoryGenre(data: { storyId: string; genreId: string }): Promise<any> {
    // For now, return null - in full implementation would insert into story_genres table
    return null;
  }

  // Creator analytics
  async getTopCreators(limit: number = 5): Promise<{ id: string; username: string; avatar_url?: string; comics_count: number }[]> {
    /*
      Determine the most active creators in the last 30 days by number of published comics.
      Adjust query when stories table should be included.
    */
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const { data, error } = await supabase
      .from('comics')
      .select('author_id, profiles:profiles(id, username, avatar_url), comics_count:count(*)')
      .gte('created_at', since.toISOString())
      .eq('is_published', true)
      .order('comics_count', { ascending: false })
      .limit(limit)
      .returns<{ author_id: string; profiles: { id: string; username: string; avatar_url?: string }; comics_count: number }[]>();

    if (error || !data) {
      console.error('Get top creators error:', error);
      return [];
    }

    return data.map((row) => ({
      id: row.profiles?.id || row.author_id,
      username: row.profiles?.username || 'Unknown',
      avatar_url: row.profiles?.avatar_url || undefined,
      comics_count: row.comics_count,
    }));
  }

  // Comic methods
  async getComics(options: { authorId?: string; includeDrafts?: boolean; limit?: number; offset?: number } = {}): Promise<SupabaseComic[]> {
    let query = supabase
      .from('comics')
      .select('*')
      .order('created_at', { ascending: false });

    if (!options.includeDrafts) {
      query = query.eq('is_published', true);
    }
    if (options.authorId) {
      query = query.eq('author_id', options.authorId);
    }
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, (options.offset || 0) + (options.limit || 50) - 1);
    }

    const { data, error } = await query.returns<SupabaseComic[]>();
    if (error || !data) {
      console.error('Get comics error:', error);
      return [];
    }
    return data;
  }

  // Comic methods
  async createComic(comic: Omit<SupabaseComic, 'id' | 'created_at' | 'updated_at'>): Promise<SupabaseComic | null> {
    const { data, error } = await supabase
      .from('comics')
      .insert(comic)
      .select()
      .single();
    if (error) {
      console.error('Create comic error:', error);
      return null;
    }
    return data;
  }

  // Story methods
  async getStory(id: string): Promise<SupabaseStory | null> {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Get story error:', error);
      return null;
    }

    return data;
  }

  async getStories(options: {
    authorId?: string;
    genreId?: number;
    placement?: string;
    isPremium?: boolean;
    isShortStory?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<SupabaseStory[]> {
    console.log('getStories called with options:', options);
    
    let query = supabase
      .from('stories')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (options.authorId) {
      query = query.eq('author_id', options.authorId);
    }

    if (options.isPremium !== undefined) {
      query = query.eq('is_premium', options.isPremium);
    }

    if (options.isShortStory !== undefined) {
      query = query.eq('is_short_story', options.isShortStory);
    }

    if (options.placement) {
      console.log('Filtering by placement:', options.placement);
      query = query.eq('placement', options.placement);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get stories error:', error);
      return [];
    }
    
    console.log('getStories result:', data?.length || 0, 'stories found');
    if (data && data.length > 0) {
      console.log('Sample story placements:', data.slice(0, 3).map(s => ({ id: s.id, title: s.title, placement: s.placement })));
    }

    return data || [];
  }

  async getFeaturedStories(limit: number = 3): Promise<SupabaseStory[]> {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Get featured stories error:', error);
      return [];
    }

    return data || [];
  }

  async getTopRatedStories(limit: number = 4): Promise<SupabaseStory[]> {
    // For now, just return recent stories. In a full implementation,
    // you'd join with ratings table and calculate averages
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Get top rated stories error:', error);
      return [];
    }

    return data || [];
  }

  async getAuthorStories(authorId: string): Promise<SupabaseStory[]> {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('author_id', authorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get author stories error:', error);
      return [];
    }

    return data || [];
  }

  async createStory(story: Omit<SupabaseStory, 'id' | 'created_at' | 'updated_at'>): Promise<SupabaseStory | null> {
    console.log('=== SUPABASE STORY CREATION ===');
    console.log('Input story data:', JSON.stringify(story, null, 2));
    
    try {
      const { data, error } = await supabase
        .from('stories')
        .insert(story)
        .select()
        .single();

      if (error) {
        console.error('=== SUPABASE ERROR ===');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        return null;
      }

      console.log('=== STORY CREATED SUCCESSFULLY ===');
      console.log('Created story:', JSON.stringify(data, null, 2));
      return data;
    } catch (err) {
      console.error('=== UNEXPECTED ERROR IN createStory ===');
      console.error('Error:', err);
      return null;
    }
  }

  async addStory(story: any): Promise<SupabaseStory | null> {
    return this.createStory(story);
  }

  async updateStory(id: string, updates: Partial<SupabaseStory>): Promise<SupabaseStory | null> {
    const { data, error } = await supabase
      .from('stories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update story error:', error);
      return null;
    }

    return data;
  }

  async deleteStory(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete story error:', error);
      return false;
    }

    return true;
  }

  async countAuthorStories(authorId: string, isShortStory: boolean): Promise<number> {
    const { count, error } = await supabase
      .from('stories')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', authorId)
      .eq('is_short_story', isShortStory);

    if (error) {
      console.error('Count author stories error:', error);
      return 0;
    }

    return count || 0;
  }

  // Rating methods
  async getRating(userId: string, storyId: string): Promise<any> {
    const { data, error } = await supabase
      .from('story_ratings')
      .select('*')
      .eq('user_id', userId)
      .eq('story_id', storyId)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  async getRatings(storyId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('story_ratings')
      .select('*')
      .eq('story_id', storyId);

    if (error) {
      console.error('Get ratings error:', error);
      return [];
    }

    return data || [];
  }

  async createRating(rating: { user_id: string; story_id: string; rating: number; review?: string }): Promise<any> {
    const { data, error } = await supabase
      .from('story_ratings')
      .insert(rating)
      .select()
      .single();

    if (error) {
      console.error('Create rating error:', error);
      return null;
    }

    return data;
  }

  async updateRating(id: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from('story_ratings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update rating error:', error);
      return null;
    }

    return data;
  }

  async getAverageRating(storyId: string): Promise<number> {
    const { data, error } = await supabase
      .from('story_ratings')
      .select('rating')
      .eq('story_id', storyId);

    if (error || !data || data.length === 0) {
      return 0;
    }

    const sum = data.reduce((acc, rating) => acc + rating.rating, 0);
    return sum / data.length;
  }

  // Bookmark methods
  async getBookmark(userId: string, storyId: string): Promise<any> {
    const { data, error } = await supabase
      .from('story_bookmarks')
      .select('*')
      .eq('user_id', userId)
      .eq('story_id', storyId)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  async getBookmarks(userId: string): Promise<SupabaseStory[]> {
    const { data, error } = await supabase
      .from('story_bookmarks')
      .select(`
        story_id,
        stories (*)
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Get bookmarks error:', error);
      return [];
    }

    return (data?.map((bookmark: any) => bookmark.stories).filter(Boolean) || []) as SupabaseStory[];
  }

  async createBookmark(bookmark: { user_id: string; story_id: string }): Promise<any> {
    const { data, error } = await supabase
      .from('story_bookmarks')
      .insert(bookmark)
      .select()
      .single();

    if (error) {
      console.error('Create bookmark error:', error);
      return null;
    }

    return data;
  }

  async deleteBookmark(userId: string, storyId: number): Promise<boolean> {
    const { error } = await supabase
      .from('story_bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('story_id', storyId);

    if (error) {
      console.error('Delete bookmark error:', error);
      return false;
    }

    return true;
  }

    // Project methods
  async createProject(project: Omit<any, never>): Promise<any | null> {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single();
    if (error) {
      console.error('Create project error:', error);
      return null;
    }
    return data;
  }

  // Admin metrics
  async countUsers(): Promise<number> {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Count users error:', error);
      return 0;
    }

    return count || 0;
  }

  async countSubscribers(): Promise<number> {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_premium', true);

    if (error) {
      console.error('Count subscribers error:', error);
      return 0;
    }

    return count || 0;
  }

  async countStories(): Promise<number> {
    const { count, error } = await supabase
      .from('stories')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Count stories error:', error);
      return 0;
    }

    return count || 0;
  }

  // Character methods
  async getCharacter(id: string | number): Promise<any | null> {
    const { data, error } = await supabase
      .from('legendary_characters')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Get character error:', error);
      return null;
    }
    return data;
  }

  async getCharacters(): Promise<any[]> {
    const { data, error } = await supabase
      .from('legendary_characters')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get characters error:', error);
      return [];
    }

    return data || [];
  }

  async createCharacter(char: { name: string; description: string; role: string; image: string; backgroundStory?: string; characterType?: string; associatedStories?: number[] }): Promise<any | null> {
    // Map frontend fields to database schema
    const dbChar = {
      name: char.name,
      description: char.description,
      photo_url: char.image,
      bio: char.backgroundStory || char.description,
      // Note: legendary_characters table doesn't have role, characterType, or associatedStories fields
      // These may need to be added to the schema or handled differently
    };

    const { data, error } = await supabase
      .from('legendary_characters')
      .insert(dbChar)
      .select()
      .single();

    if (error) {
      console.error('Create character error:', error);
      return null;
    }

    return data;
  }

  async updateCharacter(id: string | number, updates: Partial<{ name: string; description: string; role: string; image: string; backgroundStory?: string; characterType?: string; associatedStories?: number[] }>): Promise<any | null> {
    // Map frontend fields to database schema
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.description) dbUpdates.description = updates.description;
    if (updates.image) dbUpdates.photo_url = updates.image;
    if (updates.backgroundStory) dbUpdates.bio = updates.backgroundStory;
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('legendary_characters')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update character error:', error);
      return null;
    }

    return data;
  }

  async deleteCharacter(id: string | number): Promise<boolean> {
    const { error } = await supabase
      .from('legendary_characters')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete character error:', error);
      return false;
    }

    return true;
  }

  // TaleCraft Project methods
  async getTaleCraftProjects(authorId: string, type?: 'story' | 'comic' | 'photo'): Promise<TaleCraftProject[]> {
    let query = supabase
      .from('talecraft_projects')
      .select('*')
      .eq('author_id', authorId)
      .order('last_modified', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get TaleCraft projects error:', error);
      return [];
    }

    return data || [];
  }

  async createTaleCraftProject(project: Omit<TaleCraftProject, 'created_at' | 'updated_at'>): Promise<TaleCraftProject | null> {
    const { data, error } = await supabase
      .from('talecraft_projects')
      .insert({
        ...project,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Create TaleCraft project error:', error);
      return null;
    }

    return data;
  }

  async updateTaleCraftProject(id: string, updates: Partial<TaleCraftProject>): Promise<TaleCraftProject | null> {
    const { data, error } = await supabase
      .from('talecraft_projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
        last_modified: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update TaleCraft project error:', error);
      return null;
    }

    return data;
  }

  async deleteTaleCraftProject(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('talecraft_projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete TaleCraft project error:', error);
      return false;
    }

    return true;
  }

  // Purchase tracking methods
  async getUserPurchases(userId: string): Promise<{ stories: any[], novels: any[] }> {
    const { data: storyPurchases, error: storyError } = await supabase
      .from('user_purchases')
      .select('*, stories(*)')
      .eq('user_id', userId)
      .eq('item_type', 'story');

    const { data: novelPurchases, error: novelError } = await supabase
      .from('user_purchases')
      .select('*, novels(*)')
      .eq('user_id', userId)
      .eq('item_type', 'novel');

    if (storyError || novelError) {
      console.error('Get purchases error:', storyError || novelError);
      return { stories: [], novels: [] };
    }

    return {
      stories: storyPurchases || [],
      novels: novelPurchases || []
    };
  }

  async recordPurchase(userId: string, itemId: string, itemType: 'story' | 'novel', amount: number): Promise<boolean> {
    const { error } = await supabase
      .from('user_purchases')
      .insert({
        user_id: userId,
        item_id: itemId,
        item_type: itemType,
        amount,
        purchased_at: new Date().toISOString()
      });

    if (error) {
      console.error('Record purchase error:', error);
      return false;
    }

    return true;
  }

  // Tales of Prophets content methods
  async getTalesOfProphetsContent(): Promise<{ prophets: any[], companions: any[] }> {
    const { data: prophets, error: prophetsError } = await supabase
      .from('tales_prophets')
      .select('*')
      .order('name');

    const { data: companions, error: companionsError } = await supabase
      .from('tales_companions')
      .select('*')
      .order('name');

    if (prophetsError || companionsError) {
      console.error('Get tales content error:', prophetsError || companionsError);
      return { prophets: [], companions: [] };
    }

    return {
      prophets: prophets || [],
      companions: companions || []
    };
  }

  async addProphetTale(tale: { name: string; slug: string; img: string; description?: string }): Promise<any | null> {
    const { data, error } = await supabase
      .from('tales_prophets')
      .insert(tale)
      .select()
      .single();

    if (error) {
      console.error('Add prophet tale error:', error);
      return null;
    }

    return data;
  }

  async addCompanionTale(tale: { name: string; slug: string; img: string; description?: string }): Promise<any | null> {
    const { data, error } = await supabase
      .from('tales_companions')
      .insert(tale)
      .select()
      .single();

    if (error) {
      console.error('Add companion tale error:', error);
      return null;
    }

    return data;
  }

  // Collaborator methods
  async addCollaborators(storyId: string, userIds: string[], role: string = 'co_author'): Promise<boolean> {
    const rows = userIds.map(uid => ({ story_id: storyId, user_id: uid, role }));
    const { error } = await supabase.from('story_collaborators').insert(rows);
    if (error) {
      console.error('Add collaborators error:', error);
      return false;
    }
    return true;
  }

  async getCollaborators(storyId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('story_collaborators')
      .select('user_id, role, profiles:profiles(id, username, full_name, avatar_url)')
      .eq('story_id', storyId);
    if (error) {
      console.error('Get collaborators error:', error);
      return [];
    }
    return data || [];
  }

  async removeCollaborator(storyId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('story_collaborators')
      .delete()
      .eq('story_id', storyId)
      .eq('user_id', userId);
    if (error) {
      console.error('Remove collaborator error:', error);
      return false;
    }
    return true;
  }

  // Chapter versioning methods
  async createChapterVersion(chapterId: string, content: string, fileUrl?: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('chapter_versions')
      .insert({
        chapter_id: chapterId,
        content,
        file_url: fileUrl,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Create chapter version error:', error);
      return null;
    }

    return data;
  }

  async getChapterVersions(chapterId: number): Promise<any[]> {
    const { data, error } = await supabase
      .from('chapter_versions')
      .select('*')
      .eq('chapter_id', chapterId)
      .order('version_no', { ascending: false });

    if (error) {
      console.error('Get chapter versions error:', error);
      return [];
    }

    return data || [];
  }

  async updateChapterWithVersioning(chapterId: string, updates: any): Promise<boolean> {
    // First, create a version of the current chapter
    const currentChapter = await this.getChapterById(chapterId);
    if (currentChapter) {
      await this.createChapterVersion(chapterId, currentChapter.content, currentChapter.file_url);
    }

    // Then update the chapter
    const { error } = await supabase
      .from('story_chapters')
      .update(updates)
      .eq('id', chapterId);

    if (error) {
      console.error('Update chapter with versioning error:', error);
      return false;
    }

    return true;
  }

  async getChapterById(chapterId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('story_chapters')
      .select('*')
      .eq('id', chapterId)
      .single();

    if (error) {
      console.error('Get chapter by ID error:', error);
      return null;
    }

    return data;
  }
}

export const supabaseStorage = new SupabaseStorage();
