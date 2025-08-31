import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("fullName").notNull(),
  bio: text("bio").default(""),
  avatarUrl: text("avatarUrl").default(""),
  isPremium: boolean("isPremium").default(false),
  isAuthor: boolean("isAuthor").default(false),
  isAdmin: boolean("isAdmin").default(false),
});

export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content").notNull(),
  coverImage: text("coverImage").default(""),
  authorId: integer("authorId").notNull(),
  isPremium: boolean("isPremium").default(false),
  isPublished: boolean("isPublished").default(false),
  isShortStory: boolean("isShortStory").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const genres = pgTable("genres", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
});

export const storyGenres = pgTable("storyGenres", {
  storyId: integer("storyId").notNull(),
  genreId: integer("genreId").notNull(),
});

export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  storyId: integer("storyId").notNull(),
  rating: integer("rating").notNull(),
  review: text("review").default(""),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  coverImage: text("coverImage").default(""),
  projectType: text("projectType").$type<"story" | "comic">().notNull(),
  authorId: integer("authorId").notNull(),
  genre: text("genre").notNull(),
  page: text("page").notNull(),
  contentPath: text("contentPath").notNull(),
  isPublished: boolean("isPublished").default(false),
  isApproved: boolean("isApproved").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  storyId: integer("storyId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users, {
  username: z.string().min(1),
  password: z.string().min(1),
  email: z.string().email(),
  fullName: z.string().min(1)
});

export const insertStorySchema = createInsertSchema(stories, {
  title: z.string().min(1),
  description: z.string().min(1),
  content: z.string().min(1),
  authorId: z.number()
});

export const insertGenreSchema = createInsertSchema(genres, {
  name: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().min(1)
});

export const insertStoryGenreSchema = createInsertSchema(storyGenres, {
  storyId: z.number(),
  genreId: z.number()
});

export const insertRatingSchema = createInsertSchema(ratings, {
  userId: z.number(),
  storyId: z.number(),
  rating: z.number()
});

export const insertBookmarkSchema = createInsertSchema(bookmarks, {
  userId: z.number(),
  storyId: z.number()
});
export const insertProjectSchema = createInsertSchema(projects);

// Select Types
export type User = typeof users.$inferSelect;
export type Story = typeof stories.$inferSelect;
export type Genre = typeof genres.$inferSelect;
export type StoryGenre = typeof storyGenres.$inferSelect;
export type Rating = typeof ratings.$inferSelect;
export type Bookmark = typeof bookmarks.$inferSelect;

// Insert Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type InsertGenre = z.infer<typeof insertGenreSchema>;
export type InsertStoryGenre = z.infer<typeof insertStoryGenreSchema>;
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// Extended schemas for auth
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Valid email is required"),
  fullName: z.string().min(1, "Full name is required"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Story publishing schema with additional validations
export const publishStorySchema = insertStorySchema.extend({
  genreIds: z.array(z.number()).min(1, "At least one genre is required"),
  content: z.string().min(100, "Story content must be at least 100 characters"),
});

// TalesCraft publishing schema
// TalesCraft publishing schema with page selection
export const PUBLISH_PAGES = [
  "adventure",
  "romance",
  "scifi",
  "writers_gems",
  "hekayaty_original",
  "epic_comics"
] as const;

export const taleCraftPublishSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  authorName: z.string().min(1, "Author name is required"),
  // If format is html then content (html string) is required; if pdf then contentPath (url) is required
  content: z.string().optional(),
  contentPath: z.string().url().optional(),
  coverImage: z.string().optional(),
  genre: z.enum(["adventure", "romance", "scifi", "writers_gems", "hekayaty_original"]),
  projectType: z.enum(["story", "comic"]),
  page: z.enum(PUBLISH_PAGES),
  format: z.enum(["html", "pdf"]),
  isPremium: z.boolean().default(false),
});

// Genre mapping for publishing
export const GENRE_PAGES = {
  adventure: "Adventure",
  romance: "Romance", 
  scifi: "Sci-Fi",
  writers_gems: "Writer's Gems",
  hekayaty_original: "Hekayaty Original", // Admin only
  comic: "Epic Comics" // Comics only
} as const;

export type TaleCraftPublish = z.infer<typeof taleCraftPublishSchema>;
