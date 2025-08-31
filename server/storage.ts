import {
  users, stories, genres, storyGenres, ratings, bookmarks,
  type User, type Story, type Genre, type StoryGenre, type Rating, type Bookmark,
  type InsertUser, type InsertStory, type InsertGenre, type InsertStoryGenre, type InsertRating, type InsertBookmark
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Story methods
  getStory(id: number): Promise<Story | undefined>;
  getStories(options?: { authorId?: number, genreId?: number, isPremium?: boolean, isShortStory?: boolean, limit?: number, offset?: number }): Promise<Story[]>;
  getFeaturedStories(limit?: number): Promise<Story[]>;
  getTopRatedStories(limit?: number): Promise<(Story & { averageRating: number })[]>;
  getAuthorStories(authorId: number): Promise<Story[]>;
  createStory(story: InsertStory): Promise<Story>;
  updateStory(id: number, story: Partial<Story>): Promise<Story | undefined>;
  deleteStory(id: number): Promise<boolean>;
  countAuthorStories(authorId: number, isShortStory: boolean): Promise<number>;
  
  // Genre methods
  getGenre(id: number): Promise<Genre | undefined>;
  getGenres(): Promise<Genre[]>;
  createGenre(genre: InsertGenre): Promise<Genre>;
  getStoryGenres(storyId: number): Promise<Genre[]>;
  addStoryGenre(storyGenre: InsertStoryGenre): Promise<void>;
  
  // Rating methods
  getRating(userId: number, storyId: number): Promise<Rating | undefined>;
  getRatings(storyId: number): Promise<Rating[]>;
  createRating(rating: InsertRating): Promise<Rating>;
  updateRating(id: number, rating: Partial<Rating>): Promise<Rating | undefined>;
  getAverageRating(storyId: number): Promise<number>;
  
  // Bookmark methods
  getBookmark(userId: number, storyId: number): Promise<Bookmark | undefined>;
  getBookmarks(userId: number): Promise<Story[]>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  deleteBookmark(userId: number, storyId: number): Promise<boolean>;
  // Admin metrics
  countUsers(): Promise<number>;
  countSubscribers(): Promise<number>;
  countStories(): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private stories: Map<number, Story>;
  private genres: Map<number, Genre>;
  private storyGenres: Map<string, StoryGenre>;
  private ratings: Map<number, Rating>;
  private bookmarks: Map<number, Bookmark>;
  
  userIdCounter: number;
  storyIdCounter: number;
  genreIdCounter: number;
  ratingIdCounter: number;
  bookmarkIdCounter: number;

  constructor() {
    this.users = new Map();
    this.stories = new Map();
    this.genres = new Map();
    this.storyGenres = new Map();
    this.ratings = new Map();
    this.bookmarks = new Map();
    
    this.userIdCounter = 1;
    this.storyIdCounter = 1;
    this.genreIdCounter = 1;
    this.ratingIdCounter = 1;
    this.bookmarkIdCounter = 1;
    
    // Initialize with default genres
    this.seedGenres();

    // Seed default admin user
    const adminId = this.userIdCounter++;
    this.users.set(adminId, {
      id: adminId,
      username: "hekaadmin25",
      password: "hek29200",
      email: "admin@example.com",
      fullName: "Admin User",
      bio: "",
      avatarUrl: "",
      isPremium: false,
      isAuthor: false,
      isAdmin: true,
    });

  }

  private seedGenres() {
    const defaultGenres = [
      { name: "Fantasy", description: "Stories with magic, mythical creatures, and supernatural elements", icon: "fa-magic" },
      { name: "Romance", description: "Stories focused on romantic relationships", icon: "fa-heart" },
      { name: "Mystery", description: "Stories that involve solving a crime or puzzle", icon: "fa-mask" },
      { name: "Science Fiction", description: "Stories based on scientific possibilities and technological advancements", icon: "fa-rocket" },
      { name: "Horror", description: "Stories intended to frighten, scare, or disgust", icon: "fa-ghost" },
      { name: "Adventure", description: "Stories that involve excitement, danger, and risk-taking", icon: "fa-mountain" },
    ];

    defaultGenres.forEach(genre => {
      const id = this.genreIdCounter++;
      this.genres.set(id, { ...genre, id });
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = {
      id,
      bio: null,
      avatarUrl: null,
      isPremium: null,
      isAuthor: null,
    isAdmin: null,
      ...insertUser,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Story methods
  async getStory(id: number): Promise<Story | undefined> {
    return this.stories.get(id);
  }

  async getStories(options?: { 
    authorId?: number, 
    genreId?: number, 
    isPremium?: boolean, 
    isShortStory?: boolean, 
    limit?: number, 
    offset?: number 
  }): Promise<Story[]> {
    let stories = Array.from(this.stories.values()).filter(s => s.isPublished);
    
    if (options) {
      if (options.authorId !== undefined) {
        stories = stories.filter(story => story.authorId === options.authorId);
      }
      
      if (options.genreId !== undefined) {
        const storyIdsWithGenre = Array.from(this.storyGenres.values())
          .filter(sg => sg.genreId === options.genreId)
          .map(sg => sg.storyId);
        
        stories = stories.filter(story => storyIdsWithGenre.includes(story.id));
      }
      
      if (options.isPremium !== undefined) {
        stories = stories.filter(story => story.isPremium === options.isPremium);
      }
      
      if (options.isShortStory !== undefined) {
        stories = stories.filter(story => story.isShortStory === options.isShortStory);
      }
      
      // Sort by createdAt date descending (newest first)
      stories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Apply pagination
      const offset = options.offset || 0;
      const limit = options.limit || stories.length;
      stories = stories.slice(offset, offset + limit);
    }
    
    return stories;
  }

  async getFeaturedStories(limit = 3): Promise<Story[]> {
    const stories = Array.from(this.stories.values())
      .filter(s => s.isPublished)
      .sort(() => Math.random() - 0.5) // Simple random selection for featured
      .slice(0, limit);
    
    return stories;
  }

  async getTopRatedStories(limit = 4): Promise<(Story & { averageRating: number })[]> {
    const stories = Array.from(this.stories.values()).filter(s => s.isPublished);
    
    const storiesWithRatings = await Promise.all(
      stories.map(async (story) => {
        const averageRating = await this.getAverageRating(story.id);
        return { ...story, averageRating };
      })
    );
    
    return storiesWithRatings
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, limit);
  }

  async getAuthorStories(authorId: number): Promise<Story[]> {
    return Array.from(this.stories.values())
      .filter(story => story.authorId === authorId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createStory(insertStory: InsertStory): Promise<Story> {
    const id = this.storyIdCounter++;
    const now = new Date();
    const story: Story = {
      id,
      isPremium: null,
      coverImage: null,
      isPublished: null,
      isShortStory: null,
      createdAt: now,
      updatedAt: now,
      ...insertStory,
    };
    
    this.stories.set(id, story);
    return story;
  }

  async updateStory(id: number, storyData: Partial<Story>): Promise<Story | undefined> {
    const story = this.stories.get(id);
    if (!story) return undefined;
    
    const updatedStory: Story = { 
      ...story, 
      ...storyData, 
      updatedAt: new Date() 
    };
    
    this.stories.set(id, updatedStory);
    return updatedStory;
  }

  async deleteStory(id: number): Promise<boolean> {
    return this.stories.delete(id);
  }

  async countAuthorStories(authorId: number, isShortStory: boolean): Promise<number> {
    return Array.from(this.stories.values()).filter(
      story => story.authorId === authorId && story.isShortStory === isShortStory
    ).length;
  }

  // Genre methods
  async getGenre(id: number): Promise<Genre | undefined> {
    return this.genres.get(id);
  }

  async getGenres(): Promise<Genre[]> {
    return Array.from(this.genres.values());
  }

  async createGenre(insertGenre: InsertGenre): Promise<Genre> {
    const id = this.genreIdCounter++;
    const genre: Genre = { ...insertGenre, id };
    this.genres.set(id, genre);
    return genre;
  }

  async getStoryGenres(storyId: number): Promise<Genre[]> {
    const genreIds = Array.from(this.storyGenres.values())
      .filter(sg => sg.storyId === storyId)
      .map(sg => sg.genreId);
    
    return Array.from(this.genres.values())
      .filter(genre => genreIds.includes(genre.id));
  }

  async addStoryGenre(storyGenre: InsertStoryGenre): Promise<void> {
    const key = `${storyGenre.storyId}-${storyGenre.genreId}`;
    this.storyGenres.set(key, storyGenre);
  }

  // Rating methods
  async getRating(userId: number, storyId: number): Promise<Rating | undefined> {
    return Array.from(this.ratings.values()).find(
      rating => rating.userId === userId && rating.storyId === storyId
    );
  }

  async getRatings(storyId: number): Promise<Rating[]> {
    return Array.from(this.ratings.values())
      .filter(rating => rating.storyId === storyId);
  }

  async createRating(insertRating: InsertRating): Promise<Rating> {
    const id = this.ratingIdCounter++;
    const rating: Rating = {
      id,
      review: null,
      createdAt: new Date(),
      ...insertRating,
    };
    
    this.ratings.set(id, rating);
    return rating;
  }

  async updateRating(id: number, ratingData: Partial<Rating>): Promise<Rating | undefined> {
    const rating = this.ratings.get(id);
    if (!rating) return undefined;
    
    const updatedRating: Rating = { ...rating, ...ratingData };
    this.ratings.set(id, updatedRating);
    return updatedRating;
  }

  async getAverageRating(storyId: number): Promise<number> {
    const ratings = Array.from(this.ratings.values())
      .filter(rating => rating.storyId === storyId);
    
    if (ratings.length === 0) return 0;
    
    const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    return sum / ratings.length;
  }

  // Bookmark methods
  async getBookmark(userId: number, storyId: number): Promise<Bookmark | undefined> {
    return Array.from(this.bookmarks.values()).find(
      bookmark => bookmark.userId === userId && bookmark.storyId === storyId
    );
  }

  async getBookmarks(userId: number): Promise<Story[]> {
    const storyIds = Array.from(this.bookmarks.values())
      .filter(bookmark => bookmark.userId === userId)
      .map(bookmark => bookmark.storyId);
    
    return Array.from(this.stories.values())
      .filter(story => storyIds.includes(story.id));
  }

  async createBookmark(insertBookmark: InsertBookmark): Promise<Bookmark> {
    const id = this.bookmarkIdCounter++;
    const bookmark: Bookmark = { 
      ...insertBookmark, 
      id, 
      createdAt: new Date() 
    };
    
    this.bookmarks.set(id, bookmark);
    return bookmark;
  }

  async deleteBookmark(userId: number, storyId: number): Promise<boolean> {
    const bookmark = Array.from(this.bookmarks.values()).find(
      b => b.userId === userId && b.storyId === storyId
    );
    
    if (!bookmark) return false;
    return this.bookmarks.delete(bookmark.id);
  }

  // Admin metric helpers
  async countUsers(): Promise<number> {
    return this.users.size;
  }

  async countSubscribers(): Promise<number> {
    return Array.from(this.users.values()).filter(u => u.isPremium).length;
  }

  async countStories(): Promise<number> {
    return this.stories.size;
  }

  // Currently we are pausing DB work, so we fall back to the in-memory implementation.
// Swap to `new DatabaseStorage()` once the database layer is finished.
}

// Currently we are pausing DB work, so we fall back to the in-memory implementation.
export const storage = new MemStorage();
