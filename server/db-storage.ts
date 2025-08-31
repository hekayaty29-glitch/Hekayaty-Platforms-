import { eq, and, desc, count, avg, inArray } from "drizzle-orm";
import { 
  users, stories, genres, storyGenres, ratings, bookmarks,
  type User, type Story, type Genre, type StoryGenre, type Rating, type Bookmark,
  type InsertUser, type InsertStory, type InsertGenre, type InsertStoryGenre, type InsertRating, type InsertBookmark
} from "@shared/schema";
import { IStorage } from "./storage";
import { db } from "./db";

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser as any).returning();
    return result[0];
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    
    return result[0];
  }

  // Story methods
  async getStory(id: number): Promise<Story | undefined> {
    const result = await db.select().from(stories).where(eq(stories.id, id));
    return result[0];
  }

  async getStories(options?: { 
    authorId?: number, 
    genreId?: number, 
    isPremium?: boolean, 
    isShortStory?: boolean,
    limit?: number,
    offset?: number
  }): Promise<Story[]> {
    // Build where conditions
    const whereConditions = [eq(stories.isPublished, true)];
    
    if (options?.authorId) {
      whereConditions.push(eq(stories.authorId, options.authorId));
    }
    
    if (options?.isPremium !== undefined) {
      whereConditions.push(eq(stories.isPremium, options.isPremium));
    }
    
    if (options?.isShortStory !== undefined) {
      whereConditions.push(eq(stories.isShortStory, options.isShortStory));
    }
    
    let result: Story[];
    
    // Handle genre separately since it involves a join
    if (options?.genreId) {
      // Get all story IDs that have this genre first
      const storyGenreResults = await db.select({ storyId: storyGenres.storyId })
        .from(storyGenres)
        .where(eq(storyGenres.genreId, options.genreId));
      
      const storyIds = storyGenreResults.map(row => row.storyId);
      
      // If no stories with this genre, return empty array
      if (storyIds.length === 0) {
        return [];
      }
      
      // Fetch stories that match the IDs and other conditions
      result = await db.select()
        .from(stories)
        .where(and(...whereConditions, inArray(stories.id, storyIds)))
        .orderBy(desc(stories.createdAt))
        .limit(options?.limit || 100)
        .offset(options?.offset || 0);
    } else {
      // Simple query without genre filtering
      result = await db.select()
        .from(stories)
        .where(and(...whereConditions))
        .orderBy(desc(stories.createdAt))
        .limit(options?.limit || 100)
        .offset(options?.offset || 0);
    }
    
    return result;
  }

  async getFeaturedStories(limit = 3): Promise<Story[]> {
    return await db.select()
      .from(stories)
      .where(eq(stories.isPublished, true))
      .orderBy(desc(stories.createdAt))
      .limit(limit);
  }

  async getTopRatedStories(limit = 4): Promise<(Story & { averageRating: number })[]> {
    // First get all stories with their average ratings
    const storyRatings = await db.select({
      storyId: ratings.storyId,
      averageRating: avg(ratings.rating).mapWith(Number)
    })
    .from(ratings)
    .groupBy(ratings.storyId);
    
    // Create a map of story ID to rating for fast lookup
    const ratingMap = new Map(
      storyRatings.map(item => [item.storyId, item.averageRating || 0])
    );
    
    // Get stories in most recently created order
    const topStories = await db.select()
      .from(stories)
      .where(eq(stories.isPublished, true))
      .orderBy(desc(stories.createdAt))
      .limit(limit);
    
    // Add the average rating to each story and sort
    return topStories.map(story => ({
      ...story,
      averageRating: ratingMap.get(story.id) || 0
    }))
    .sort((a, b) => b.averageRating - a.averageRating);
  }

  async getAuthorStories(authorId: number): Promise<Story[]> {
    return await db.select()
      .from(stories)
      .where(eq(stories.authorId, authorId))
      .orderBy(desc(stories.createdAt));
  }

  async createStory(insertStory: InsertStory): Promise<Story> {
    const now = new Date();
    const result = await db.insert(stories)
      .values({
        ...insertStory,
        createdAt: now,
        updatedAt: now
      } as any)
      .returning();
    
    return result[0];
  }

  async updateStory(id: number, storyData: Partial<Story>): Promise<Story | undefined> {
    const now = new Date();
    const result = await db.update(stories)
      .set({
        ...storyData
      })
      .where(eq(stories.id, id))
      .returning();
    
    return result[0];
  }

  async deleteStory(id: number): Promise<boolean> {
    // Delete related data first (to avoid foreign key constraints)
    await db.delete(storyGenres).where(eq(storyGenres.storyId, id));
    await db.delete(ratings).where(eq(ratings.storyId, id));
    await db.delete(bookmarks).where(eq(bookmarks.storyId, id));
    
    // Delete the story
    const result = await db.delete(stories)
      .where(eq(stories.id, id))
      .returning({ id: stories.id });
    
    return result.length > 0;
  }

  async countAuthorStories(authorId: number, isShortStory: boolean): Promise<number> {
    const result = await db.select({ count: count() })
      .from(stories)
      .where(
        and(
          eq(stories.authorId, authorId),
          eq(stories.isShortStory, isShortStory)
        )
      );
    
    return Number(result[0]?.count || 0);
  }

  // Genre methods
  async getGenre(id: number): Promise<Genre | undefined> {
    const result = await db.select().from(genres).where(eq(genres.id, id));
    return result[0];
  }

  async getGenres(): Promise<Genre[]> {
    return await db.select().from(genres);
  }

  async createGenre(insertGenre: InsertGenre): Promise<Genre> {
    const result = await db.insert(genres).values(insertGenre as any).returning();
    return result[0];
  }

  async getStoryGenres(storyId: number): Promise<Genre[]> {
    return await db.select({
      id: genres.id,
      name: genres.name,
      description: genres.description,
      icon: genres.icon
    })
    .from(genres)
    .innerJoin(
      storyGenres,
      and(
        eq(storyGenres.genreId, genres.id),
        eq(storyGenres.storyId, storyId)
      )
    );
  }

  async addStoryGenre(storyGenre: InsertStoryGenre): Promise<void> {
    await db.insert(storyGenres).values(storyGenre as any);
  }

  // Rating methods
  async getRating(userId: number, storyId: number): Promise<Rating | undefined> {
    const result = await db.select()
      .from(ratings)
      .where(
        and(
          eq(ratings.userId, userId),
          eq(ratings.storyId, storyId)
        )
      );
    
    return result[0];
  }

  async getRatings(storyId: number): Promise<Rating[]> {
    return await db.select({
      id: ratings.id,
      userId: ratings.userId,
      storyId: ratings.storyId,
      rating: ratings.rating,
      review: ratings.review,
      createdAt: ratings.createdAt,
      user: {
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl
      }
    })
    .from(ratings)
    .leftJoin(users, eq(ratings.userId, users.id))
    .where(eq(ratings.storyId, storyId));
  }

  async createRating(insertRating: InsertRating): Promise<Rating> {
    const now = new Date();
    const result = await db.insert(ratings)
      .values({
        ...insertRating,
        createdAt: now
      } as any)
      .returning();
    
    return result[0];
  }

  async updateRating(id: number, ratingData: Partial<Rating>): Promise<Rating | undefined> {
    const result = await db.update(ratings)
      .set(ratingData)
      .where(eq(ratings.id, id))
      .returning();
    
    return result[0];
  }

  async getAverageRating(storyId: number): Promise<number> {
    const result = await db.select({
      averageRating: avg(ratings.rating).mapWith(Number)
    })
    .from(ratings)
    .where(eq(ratings.storyId, storyId));
    
    return result[0]?.averageRating || 0;
  }

  // Bookmark methods
  async getBookmark(userId: number, storyId: number): Promise<Bookmark | undefined> {
    const result = await db.select()
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, userId),
          eq(bookmarks.storyId, storyId)
        )
      );
    
    return result[0];
  }

  async getBookmarks(userId: number): Promise<Story[]> {
    return await db.select({
      id: stories.id,
      title: stories.title,
      description: stories.description,
      content: stories.content,
      coverImage: stories.coverImage,
      authorId: stories.authorId,
      isPremium: stories.isPremium,
      isPublished: stories.isPublished,
      isShortStory: stories.isShortStory,
      createdAt: stories.createdAt,
      updatedAt: stories.updatedAt
    })
    .from(stories)
    .innerJoin(
      bookmarks,
      and(
        eq(bookmarks.storyId, stories.id),
        eq(bookmarks.userId, userId)
      )
    );
  }

  async createBookmark(insertBookmark: InsertBookmark): Promise<Bookmark> {
    const now = new Date();
    const result = await db.insert(bookmarks)
      .values({
        ...insertBookmark,
        createdAt: now
      } as any)
      .returning();
    
    return result[0];
  }

  async deleteBookmark(userId: number, storyId: number): Promise<boolean> {
    const result = await db.delete(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, userId),
          eq(bookmarks.storyId, storyId)
        )
      )
      .returning({ id: bookmarks.id });
    
    return result.length > 0;
  }

  // Admin metrics methods
  async countUsers(): Promise<number> {
    const result = await db.select({ count: count() }).from(users);
    return Number(result[0]?.count || 0);
  }

  async countSubscribers(): Promise<number> {
    const result = await db.select({ count: count() })
      .from(users)
      .where(eq(users.isPremium, true));
    return Number(result[0]?.count || 0);
  }

  async countStories(): Promise<number> {
    const result = await db.select({ count: count() }).from(stories);
    return Number(result[0]?.count || 0);
  }
}