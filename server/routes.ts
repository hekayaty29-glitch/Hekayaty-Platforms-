import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { supabaseStorage } from "./supabase-storage";
import { upload, uploadToCloudinary } from "./upload-routes";
import { authValidation, storyValidation, userValidation, handleValidationErrors } from "./security-middleware";
import { checkDatabasePermissions, logDatabaseQueries, auditLog } from "./database-security";
import { checkAccountLockout, recordFailedLogin, recordSuccessfulLogin, checkSuspiciousIP, recordIPAttempt } from "./auth-security";
import { 
  insertUserSchema, 
  loginSchema, 
  insertStorySchema, 
  insertRatingSchema, 
  insertBookmarkSchema,
  registerSchema,
  publishStorySchema,
  taleCraftPublishSchema
} from "@shared/schema";
import express from "express";
import { z } from "zod";
import { registerAdminAPI } from "./admin-api";
import { registerSubscriptionRoutes } from "./subscription-routes";
import { registerCommunityRoutes } from "./community-routes";
import { registerUploadRoutes } from "./upload-routes";
import { registerHallOfQuillsRoutes } from "./hall-of-quills-routes";
import { expireVibSubscriptions, getUpcomingExpirations } from "./subscription-expiry";
import { 
  supabase, 
  verifySupabaseToken, 
  requireAuth, 
  requireAdmin,
  getUserProfile,
  updateUserProfile
} from "./supabase-auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Security middleware for all API routes
  app.use('/api', logDatabaseQueries);
  
  // Apply Supabase JWT verification to protected routes (skip auth routes)
  app.use('/api', (req, res, next) => {
    // Check for suspicious IP activity
    const clientIP: string = req.ip || 'unknown';
    if (checkSuspiciousIP(clientIP)) {
      auditLog.logSecurityEvent('suspicious_ip_blocked', 'high', { ip: clientIP, path: req.path });
      return res.status(429).json({ error: 'Access temporarily restricted' });
    }
    
    recordIPAttempt(clientIP);
    
    // Public API paths that don't need JWT verification
    // Note: inside this middleware req.path has the '/api' prefix stripped
    const publicPaths = [
      '/auth/',
      '/subscriptions/free',
      '/subscriptions/redeem'
    ];
    const isPublic = publicPaths.some((p) => req.path === p || req.path.startsWith(p + '/'));
    if (isPublic) {
      return next();
    }
    return verifySupabaseToken(req, res, next);
  });
  
  // Database permissions check for authenticated routes
  app.use('/api', (req, res, next) => {
    if (req.user) {
      return checkDatabasePermissions(req, res, next);
    }
    next();
  });

  // Register admin API
  registerAdminAPI(app);
  // Register subscription code API
  registerSubscriptionRoutes(app);
  registerCommunityRoutes(app);
  // Register upload routes
  registerUploadRoutes(app);
  // Hall of Quills public & admin routes
  registerHallOfQuillsRoutes(app);

  // Subscription expiry management (admin only)
  app.post("/api/admin/expire-subscriptions", requireAdmin, async (req, res) => {
    try {
      const result = await expireVibSubscriptions();
      res.json(result);
    } catch (error) {
      console.error('Error in expire-subscriptions endpoint:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  app.get("/api/admin/upcoming-expirations", requireAdmin, async (req, res) => {
    try {
      const daysAhead = parseInt(req.query.days as string) || 7;
      const result = await getUpcomingExpirations(daysAhead);
      res.json(result);
    } catch (error) {
      console.error('Error in upcoming-expirations endpoint:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  // ---------------------------------------------------------------------------
  // Characters API
  // ---------------------------------------------------------------------------
  app.get("/api/characters", async (_req: Request, res: Response) => {
    try {
      const characters = await supabaseStorage.getCharacters();
      res.json(characters);
    } catch (err) {
      console.error("Get characters error:", err);
      res.status(500).json({ message: "Failed to fetch characters" });
    }
  });

  const insertCharacterSchema = z.object({
    name: z.string().min(2),
    description: z.string().min(10),
    role: z.string().min(2),
    image: z.string().url(),
  });

  app.post("/api/characters", requireAuth, async (req: Request, res: Response) => {
    try {
      const body = insertCharacterSchema.parse(req.body);
      const created = await supabaseStorage.createCharacter(body);
      if (!created) {
        return res.status(500).json({ message: "Could not create character" });
      }
      res.status(201).json(created);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }
      console.error("Create character error:", err);
      res.status(500).json({ message: "Failed to create character" });
    }
  });

  // Get single character by ID
  app.get("/api/characters/:id", async (req: Request, res: Response) => {
    try {
      const charId = req.params.id;
      const character = await supabaseStorage.getCharacter(charId);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      res.json(character);
    } catch (err) {
      console.error("Get character error:", err);
      res.status(500).json({ message: "Failed to fetch character" });
    }
  });

  // Update character
  const updateCharacterSchema = insertCharacterSchema.partial();
  app.put("/api/characters/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const charId = req.params.id;
      const body = updateCharacterSchema.parse(req.body);
      const updated = await supabaseStorage.updateCharacter(charId, body);
      if (!updated) {
        return res.status(500).json({ message: "Could not update character" });
      }
      res.json(updated);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }
      console.error("Update character error:", err);
      res.status(500).json({ message: "Failed to update character" });
    }
  });

  // Delete character
  app.delete("/api/characters/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const charId = req.params.id;
      const success = await supabaseStorage.deleteCharacter(charId);
      if (!success) {
        return res.status(500).json({ message: "Could not delete character" });
      }
      res.status(204).send();
    } catch (err) {
      console.error("Delete character error:", err);
      res.status(500).json({ message: "Failed to delete character" });
    }
  });

  // Top creators endpoint
  app.get("/api/creators/top", async (_req: Request, res: Response) => {
    try {
      const creators = await supabaseStorage.getTopCreators(5);
      res.json(creators);
    } catch (err) {
      console.error('Top creators error:', err);
      res.status(500).json({ message: 'Failed to fetch top creators' });
    }
  });

  

  // Authentication routes - these don't need JWT verification as they're for login/register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password, fullName } = req.body;
      
      // Check if username already exists in profiles table
      const { data: existingUsername } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.toLowerCase())
        .single();
      
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      // Create user with Supabase Auth
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: {
          username: username.toLowerCase(),
          full_name: fullName
        }
      });
      
      if (error) {
        return res.status(400).json({ message: error.message });
      }
      
      // Check if registration is before Sept 30, 2025 for automatic VIB subscription
      const currentDate = new Date();
      const vibCutoffDate = new Date('2025-09-30T23:59:59Z');
      const isEligibleForVib = currentDate <= vibCutoffDate;
      
      // Create profile in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          username: username.toLowerCase(),
          email,
          full_name: fullName,
          avatar_url: '',
          bio: '',
          is_premium: isEligibleForVib,
          is_admin: false,
          role: isEligibleForVib ? 'vip' : 'free',
          subscription_end_date: isEligibleForVib ? '2025-09-30T23:59:59Z' : null
        });
      
      if (profileError) {
        console.error('Profile creation error:', profileError);
        return res.status(500).json({ message: "Failed to create user profile" });
      }
      
      res.status(201).json({ 
        message: isEligibleForVib ? "Welcome to Hekayaty Lord! You've been granted VIB access until September 30, 2025." : "User created successfully",
        user: {
          id: data.user.id,
          email: data.user.email,
          username: username.toLowerCase(),
          full_name: fullName,
          is_premium: isEligibleForVib,
          role: isEligibleForVib ? 'vip' : 'free'
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Determine if input is email or username
      let email = username;
      if (!username.includes('@')) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', username.toLowerCase())
          .single();
        
        if (!profile?.email) {
          return res.status(401).json({ message: "Invalid username or password" });
        }
        email = profile.email;
      }
      
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Get user profile
      const profile = await getUserProfile(data.user.id);
      
      res.json({
        message: "Login successful",
        user: {
          id: data.user.id,
          email: data.user.email,
          username: profile.username,
          fullName: profile.full_name,
          avatar_url: profile.avatar_url,
          is_premium: profile.is_premium,
          is_admin: profile.is_admin
        },
        session: data.session
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        await supabase.auth.admin.signOut(token);
      }
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: "Could not log out" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const profile = await getUserProfile(req.user.id);
      
      res.json({
        id: req.user.id,
        email: req.user.email,
        username: profile.username,
        fullName: profile.full_name,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        is_premium: profile.is_premium,
        is_admin: profile.is_admin,
        role: profile.role
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    const genres = await supabaseStorage.getAllGenres();
    const stories = await supabaseStorage.getStories();
    const featuredStories = await supabaseStorage.getFeaturedStories();
    const topRatedStories = await supabaseStorage.getTopRatedStories();
    const users = await supabaseStorage.countUsers();
    const lords = await supabaseStorage.countSubscribers(); // paying users as "lords"
    const revenue_month = 0;
    res.json({ users, stories, lords, revenue_month, genres, featuredStories, topRatedStories });
  });


  // User routes
  app.get("/api/users/:id", async (req, res) => {
    const userId = req.params.id;
    
    try {
      const user = await supabaseStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Complete profile for OAuth users (Google sign-up)
  app.post("/api/auth/complete-profile", verifySupabaseToken, async (req, res) => {
    try {
      const { username, fullName } = req.body;
      const userId = req.user!.id;
      const email = req.user!.email;

      // Validate input
      if (!username || !fullName) {
        return res.status(400).json({ message: "Username and full name are required" });
      }

      // Check if username is already taken
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.toLowerCase())
        .single();

      if (existingUser) {
        return res.status(400).json({ message: "Username is already taken" });
      }

      // Create/update profile for OAuth user
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: userId, 
          username: username.toLowerCase(), 
          email: email,
          full_name: fullName,
          created_at: new Date().toISOString()
        });
        
      if (error) {
        console.error('Profile creation error:', error);
        return res.status(500).json({ message: "Failed to create profile" });
      }

      res.json({ 
        success: true, 
        message: "Profile completed successfully",
        user: {
          id: userId,
          email: email,
          username: username.toLowerCase(),
          full_name: fullName
        }
      });
    } catch (error) {
      console.error('Complete profile error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/users/:id", requireAuth, async (req, res) => {
    const userId = req.params.id;
    
    // Verify user is updating their own profile
    if (userId !== req.user!.id) {
      return res.status(403).json({ message: "You can only update your own profile" });
    }
    
    try {
      // Allow updating only certain fields
      const updateSchema = z.object({
        fullName: z.string().optional(),
        bio: z.string().optional(),
        avatarUrl: z.string().optional(),
        username: z.string().min(3).optional(),
      });
      
      const data = updateSchema.parse(req.body);

      // If username provided, ensure user has no username yet and it's unique
      if (data.username) {
        const current = await supabaseStorage.getUserProfile(userId);
        if (current?.username) {
          return res.status(400).json({ message: "Username already set" });
        }
        const existing = await supabase
          .from('profiles')
          .select('id')
          .eq('username', data.username.toLowerCase())
          .single();
        if (existing.data) {
          return res.status(400).json({ message: "Username is already taken" });
        }
        data.username = data.username.toLowerCase();
      }

      const updatedUser = await supabaseStorage.updateUser(userId, data);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users/:id/premium", requireAuth, async (req, res) => {
    const userId = req.params.id;
    
    // Verify user is updating their own subscription
    if (req.user!.id !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      const updatedProfile = await updateUserProfile(userId, { is_premium: true });
      res.json(updatedProfile);
    } catch (error) {
      console.error('Premium upgrade error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Comics routes
  app.get("/api/comics/:id", async (req, res) => {
    const comicId = req.params.id;
    if (!comicId) {
      return res.status(400).json({ message: "Invalid comic ID" });
    }

    try {
      const comic = await supabaseStorage.getComic(comicId);
      if (!comic) {
        return res.status(404).json({ message: "Comic not found" });
      }

      // Enrich comic with author data like stories
      const author = await supabaseStorage.getUser(comic.author_id);
      
      res.json({
        ...comic,
        author: author ? {
          id: author.id,
          username: author.username,
          fullName: author.full_name,
          avatarUrl: author.avatar_url,
          bio: author.bio
        } : null,
      });
    } catch (error) {
      console.error("Get comic error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/comics", async (req, res) => {
    const { authorId, includeDrafts, limit, offset } = req.query as { authorId?: string; includeDrafts?: string; limit?: string; offset?: string };
    try {
      const comics = await supabaseStorage.getComics({
        authorId,
        includeDrafts: includeDrafts === "true",
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
      });
      res.json(comics);
    } catch (err) {
      console.error("Get comics error", err);
      res.status(500).json({ message: "Failed to fetch comics" });
    }
  });

  // DELETE comic route
  app.delete("/api/comics/:id", requireAuth, async (req: Request, res: Response) => {
    const comicId = req.params.id;
    if (!comicId) {
      return res.status(400).json({ message: "Invalid comic ID" });
    }

    const comic = await supabaseStorage.getComic(comicId);
    if (!comic) {
      return res.status(404).json({ message: "Comic not found" });
    }

    if (comic.author_id.toString() !== req.user!.id) {
      return res.status(403).json({ message: "You can only delete your own comics" });
    }

    const deleted = await supabaseStorage.deleteComic(comicId);
    if (!deleted) {
      return res.status(500).json({ message: "Failed to delete comic" });
    }

    res.json({ message: "Comic deleted successfully" });
  });

  // Story routes
  app.get("/api/stories", async (req, res) => {
    try {
      const authorId = req.query.authorId ? parseInt(req.query.authorId as string, 10) : undefined;
      const genreId = req.query.genreId ? parseInt(req.query.genreId as string, 10) : undefined;
      const placement = req.query.placement as string;
      const isPremium = req.query.isPremium ? req.query.isPremium === 'true' : undefined;
      const isShortStory = req.query.isShortStory ? req.query.isShortStory === 'true' : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;
      
      console.log('GET /api/stories - Query params:', { placement, authorId, genreId, isPremium, isShortStory, limit, offset });
      
      const stories = await supabaseStorage.getStories({
        authorId: authorId?.toString(),
        genreId: genreId,
        placement: placement,
        isPremium,
        isShortStory,
        limit,
        offset
      });
      
      console.log(`GET /api/stories - Found ${stories.length} stories for placement: ${placement}`);
      
      // Add rating information to each story
      const storiesWithRatings = await Promise.all(
        stories.map(async (story) => {
          const averageRating = await supabaseStorage.getAverageRating(story.id.toString());
          const genres = await supabaseStorage.getStoryGenres(story.id.toString());
          const author = await supabaseStorage.getUser(story.author_id);
          
          // Don't include the full content in list responses
          const { content, ...storyWithoutContent } = story;
          
          return {
            ...storyWithoutContent,
            averageRating,
            genres,
            author: author ? {
              id: author.id,
              username: author.username,
              fullName: author.full_name,
              avatarUrl: author.avatar_url
            } : null
          };
        })
      );
      
      res.json(storiesWithRatings);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create story with chapters (new wizard endpoint)
  app.post("/api/stories/create-with-chapters", requireAuth, async (req: Request, res: Response) => {
    try {
      console.log('=== STORY CREATION REQUEST ===');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('User:', req.user);

      const storySchema = z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().min(10, "Description must be at least 10 characters"),
        coverImage: z.string().url().optional().or(z.literal("")),
        placement: z.string().optional(),
        authorName: z.string().min(1, "Author name is required"),
        genre: z.array(z.string()).min(1, "At least one genre is required"),
        collaborators: z.array(z.any()).optional(),
        isPremium: z.boolean().optional(),
        isPublished: z.boolean().optional()
      });

      let data;
      try {
        data = storySchema.parse(req.body);
        console.log('Schema validation passed:', data);
      } catch (validationError) {
        console.error('Schema validation failed:', validationError);
        if (validationError instanceof z.ZodError) {
          return res.status(400).json({ 
            message: validationError.errors[0].message,
            errors: validationError.errors
          });
        }
        throw validationError;
      }

      // Prepare story data for database (using correct column names from schema)
      const storyData = {
        title: data.title.trim(),
        description: data.description.trim(),
        content: '', // Will be populated by chapters
        cover_url: data.coverImage && data.coverImage !== "" ? data.coverImage : "",
        author_id: req.user!.id, // Use correct database column name
        is_premium: data.isPremium || false, // Use correct database column name
        is_published: true, // Use correct database column name - set to published when creating through publish wizard
        is_short_story: false, // Use correct database column name
        placement: data.placement || null, // Save placement/category
        genre: data.genre || [] // Save selected genres
      };

      console.log('Prepared story data for database:', storyData);

      const story = await supabaseStorage.createStory(storyData);

      if (!story) {
        console.error('Story creation returned null');
        return res.status(500).json({ message: 'Failed to create story - database returned null' });
      }

      console.log('Story created successfully:', story);
      return res.status(201).json({ 
        storyId: story.id,
        message: 'Story created successfully'
      });

    } catch (error: any) {
      console.error('=== STORY CREATION ERROR ===');
      console.error('Error type:', error?.constructor?.name);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Validation error: ' + error.errors[0].message,
          errors: error.errors
        });
      }
      
      return res.status(500).json({ 
        message: 'Internal server error during story creation',
        error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
      });
    }
  });

  // Upload chapters for a story (supports text, PDF, audio, and image formats)
  app.post("/api/stories/:id/chapters", requireAuth, upload.array('chapters', 20), async (req: Request, res: Response) => {
    try {
      const storyId = req.params.id;
      if (!storyId) {
        return res.status(400).json({ message: "Invalid story ID" });
      }

      // Verify story ownership
      const story = await supabaseStorage.getStory(storyId);
      if (!story || story.author_id !== req.user!.id) {
        return res.status(403).json({ message: "You can only upload chapters to your own stories" });
      }

      // Handle multipart file upload using existing multer setup
      if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({ message: "No chapter files provided" });
      }

      const chapterNames = req.body.chapterNames || [];
      const chapterOrders = req.body.chapterOrders || [];
      
      const chapters = [];
      
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const chapterName = chapterNames[i] || `Chapter ${i + 1}`;
        const order = parseInt(chapterOrders[i]) || i;
        
        // Determine file type and resource type for Cloudinary
        let fileType: 'pdf' | 'text' | 'audio' | 'image' = 'text';
        let resourceType: 'auto' | 'image' | 'video' | 'raw' = 'auto';
        
        if (file.mimetype === 'application/pdf') {
          fileType = 'pdf';
          resourceType = 'raw';
        } else if (file.mimetype.startsWith('audio/')) {
          fileType = 'audio';
          resourceType = 'video'; // Cloudinary uses 'video' for audio files
        } else if (file.mimetype.startsWith('image/')) {
          fileType = 'image';
          resourceType = 'image';
        }
        
        // Upload file to Cloudinary
        const uploadResult = await uploadToCloudinary(file.buffer, {
          folder: `novelnexus/chapters/${storyId}`,
          public_id: `chapter_${storyId}_${order}_${Date.now()}`,
          resource_type: resourceType
        });
        
        // Store chapter in database
        const chapter = await supabaseStorage.createChapter({
          story_id: storyId,
          title: chapterName,
          file_url: uploadResult.secure_url,
          file_type: fileType,
          chapter_order: order,
          content: fileType === 'text' ? file.buffer.toString('utf-8') : null
        });
        
        chapters.push(chapter);
      }

      return res.status(201).json({ chapters });
    } catch (error) {
      console.error('Upload chapters error', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Publish a story (mark as published with optional scheduling)
  app.put("/api/stories/:id/publish", requireAuth, async (req: Request, res: Response) => {
    try {
      const storyId = req.params.id;
      if (!storyId) {
        return res.status(400).json({ message: "Invalid story ID" });
      }

      const { publish_at } = req.body;

      // Verify story ownership
      const story = await supabaseStorage.getStory(storyId);
      if (!story || story.author_id !== req.user!.id) {
        return res.status(403).json({ message: "You can only publish your own stories" });
      }

      // Validate publish_at if provided
      if (publish_at && new Date(publish_at) <= new Date()) {
        return res.status(400).json({ message: "Publish date must be in the future" });
      }

      const updateData: any = { is_published: true };
      if (publish_at) {
        updateData.publish_at = publish_at;
      }

      const updatedStory = await supabaseStorage.updateStory(storyId, updateData);
      return res.status(200).json(updatedStory);
    } catch (error) {
      console.error('Publish story error', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Chapter navigation
  app.get('/api/stories/:id/chapters', async (req: Request, res: Response) => {
    try {
      const storyId = req.params.id;
      if (!storyId) return res.status(400).json({ message: 'Invalid story ID' });
      
      console.log('Fetching chapters for story ID:', storyId);
      const chapters = await supabaseStorage.getChapters(storyId);
      console.log('Found chapters:', chapters?.length || 0);
      console.log('Chapters data:', chapters);
      
      return res.json({ chapters });
    } catch (error) {
      console.error('Get chapters API error:', error);
      return res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get single chapter by order (0-based)
  app.get('/api/stories/:id/chapters/:order', async (req: Request, res: Response) => {
    const storyId = req.params.id;
    const order = parseInt(req.params.order, 10);
    if (!storyId || isNaN(order)) return res.status(400).json({ message: 'Invalid parameters' });
    const chapters = await supabaseStorage.getChapters(storyId);
    const chapter = chapters.find(c => c.order === order);
    if (!chapter) return res.status(404).json({ message: 'Chapter not found' });
    return res.json(chapter);
  });

  app.get('/api/stories/:id/chapters/:order/prev', async (req: Request, res: Response) => {
    const storyId = req.params.id;
    const order = parseInt(req.params.order, 10);
    if (!storyId || isNaN(order)) return res.status(400).json({ message: 'Invalid parameters' });
    const prev = await supabaseStorage.getAdjacentChapter(storyId, order, 'prev');
    if (!prev) return res.status(404).json({ message: 'No previous chapter' });
    return res.json(prev);
  });

  app.get('/api/stories/:id/chapters/:order/next', async (req: Request, res: Response) => {
    const storyId = req.params.id;
    const order = parseInt(req.params.order, 10);
    if (!storyId || isNaN(order)) return res.status(400).json({ message: 'Invalid parameters' });
    const next = await supabaseStorage.getAdjacentChapter(storyId, order, 'next');
    if (!next) return res.status(404).json({ message: 'No next chapter' });
    return res.json(next);
  });

  // Get chapter by ID
  app.get('/api/chapters/:id', async (req: Request, res: Response) => {
    const chapterId = req.params.id;
    if (!chapterId) return res.status(400).json({ message: 'Invalid chapter ID' });
    const chapter = await supabaseStorage.getChapterById(chapterId);
    return res.json(chapter);
  });

  // Get next/previous chapter
  app.get('/api/stories/:id/chapters/:order/:direction', async (req: Request, res: Response) => {
    const storyId = req.params.id;
    const order = parseInt(req.params.order, 10);
    const direction = req.params.direction as 'prev' | 'next';
    if (!storyId || isNaN(order)) return res.status(400).json({ message: 'Invalid parameters' });
    const chapter = await supabaseStorage.getAdjacentChapter(storyId, order, direction);
    if (!chapter) return res.status(404).json({ message: `No ${direction} chapter` });
    return res.json(chapter);
  });

  // Collaborator management endpoints
  app.post('/api/stories/:id/collaborators', requireAuth, async (req: Request, res: Response) => {
    try {
      const storyId = req.params.id;
      const { userIds, role = 'co_author' } = req.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: 'User IDs array is required' });
      }

      // Verify story ownership
      const story = await supabaseStorage.getStory(storyId);
      if (!story || story.author_id !== req.user!.id) {
        return res.status(403).json({ message: 'You can only manage collaborators for your own stories' });
      }

      const success = await supabaseStorage.addCollaborators(storyId, userIds, role);
      if (!success) {
        return res.status(500).json({ message: 'Failed to add collaborators' });
      }

      const collaborators = await supabaseStorage.getCollaborators(storyId);
      return res.status(201).json({ collaborators });
    } catch (error) {
      console.error('Add collaborators error', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/stories/:id/collaborators', requireAuth, async (req: Request, res: Response) => {
    try {
      const storyId = req.params.id;
      const collaborators = await supabaseStorage.getCollaborators(storyId);
      return res.json({ collaborators });
    } catch (error) {
      console.error('Get collaborators error', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/stories/:id/collaborators/:userId', requireAuth, async (req: Request, res: Response) => {
    try {
      const storyId = req.params.id;
      const userId = req.params.userId;

      // Verify story ownership
      const story = await supabaseStorage.getStory(storyId);
      if (!story || story.author_id !== req.user!.id) {
        return res.status(403).json({ message: 'You can only manage collaborators for your own stories' });
      }

      const success = await supabaseStorage.removeCollaborator(storyId, userId);
      if (!success) {
        return res.status(500).json({ message: 'Failed to remove collaborator' });
      }

      return res.status(200).json({ message: 'Collaborator removed successfully' });
    } catch (error) {
      console.error('Remove collaborator error', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Chapter versioning endpoints
  app.get('/api/chapters/:id/versions', requireAuth, async (req: Request, res: Response) => {
    try {
      const chapterId = parseInt(req.params.id, 10);
      if (isNaN(chapterId)) {
        return res.status(400).json({ message: 'Invalid chapter ID' });
      }

      const versions = await supabaseStorage.getChapterVersions(chapterId);
      return res.json({ versions });
    } catch (error) {
      console.error('Get chapter versions error', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/chapters/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const chapterId = req.params.id;
      if (!chapterId) {
        return res.status(400).json({ message: 'Invalid chapter ID' });
      }

      const { title, content, file_url } = req.body;

      // Get chapter to verify story ownership
      const chapter = await supabaseStorage.getChapterById(chapterId);
      if (!chapter) {
        return res.status(404).json({ message: 'Chapter not found' });
      }

      const story = await supabaseStorage.getStory(chapter.story_id);
      if (!story || story.author_id !== req.user!.id) {
        return res.status(403).json({ message: 'You can only edit chapters of your own stories' });
      }

      const updates: any = {};
      if (title) updates.title = title;
      if (content) updates.content = content;
      if (file_url) updates.file_url = file_url;

      const success = await supabaseStorage.updateChapterWithVersioning(chapterId, updates);
      if (!success) {
        return res.status(500).json({ message: 'Failed to update chapter' });
      }

      const updatedChapter = await supabaseStorage.getChapterById(chapterId);
      return res.json(updatedChapter);
    } catch (error) {
      console.error('Update chapter error', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Create story (author or admin) - original endpoint
  app.post("/api/stories", requireAuth, async (req: Request, res: Response) => {
    try {
      const storySchema = z.object({
        title: z.string().min(1),
        description: z.string().min(10),
        content: z.string().min(100),
        coverImage: z.string().url().optional(),
        posterImage: z.string().url().optional(),
        workshopId: z.string().uuid().optional(),
        isPremium: z.boolean().optional(),
        isShortStory: z.boolean().optional(),
        isPublished: z.boolean().optional()
      });
      const data = storySchema.parse(req.body);

      // Validate workshop ownership if provided
      if (data.workshopId) {
        const { data: workshop, error: workshopError } = await supabase
          .from('workshops')
          .select('id, owner_id')
          .eq('id', data.workshopId)
          .single();
        if (workshopError || !workshop) {
          return res.status(400).json({ message: 'Invalid workshop_id' });
        }
        if (workshop.owner_id !== req.user!.id) {
          return res.status(403).json({ message: 'You do not own this workshop' });
        }
      }

      const story = await supabaseStorage.createStory({
        title: data.title,
        description: data.description,
        content: data.content,
        cover_url: data.coverImage,
        author_id: req.user!.id,
        is_premium: data.isPremium || false,
        is_published: data.isPublished || false,
        is_short_story: data.isShortStory || false
      });

      return res.status(201).json(story);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error('Create story error', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // ---------------------------------------------------------------------------
  // Hekayaty Originals – stories tagged with the "Hekayaty Original" genre
  // ---------------------------------------------------------------------------
  app.get("/api/stories/originals", async (req, res) => {
    try {
      // Hard-coded slug matches the item returned by supabaseStorage.getAllGenres()
      const originalGenre = await supabaseStorage.getGenreBySlug("hekayaty_original");
      if (!originalGenre) {
        return res.status(404).json({ message: "Originals genre not found" });
      }

      const stories = await supabaseStorage.getStories({ genreId: originalGenre.id });

      // Add rating & author details like other list endpoints
      const storiesWithDetails = await Promise.all(
        stories.map(async (story) => {
          const averageRating = await supabaseStorage.getAverageRating(story.id.toString());
          const author = await supabaseStorage.getUser(story.author_id);

          const { content, ...storyWithoutContent } = story;

          return {
            ...storyWithoutContent,
            averageRating,
            author: author
              ? {
                  id: author.id,
                  username: author.username,
                  fullName: author.full_name,
                  avatarUrl: author.avatar_url,
                }
              : null,
          };
        })
      );

      res.json(storiesWithDetails);
    } catch (error) {
      console.error("Original stories error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/stories/featured", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 3;
      const stories = await supabaseStorage.getFeaturedStories(limit);
      
      // Add rating and genre information to each story
      const storiesWithDetails = await Promise.all(
        stories.map(async (story) => {
          const averageRating = await supabaseStorage.getAverageRating(story.id.toString());
          const genres = await supabaseStorage.getStoryGenres(story.id.toString());
          const author = await supabaseStorage.getUser(story.author_id);
          
          // Don't include the full content in list responses
          const { content, ...storyWithoutContent } = story;
          
          return {
            ...storyWithoutContent,
            averageRating,
            genres,
            author: author ? {
              id: author.id,
              username: author.username,
              fullName: author.full_name,
              avatarUrl: author.avatar_url
            } : null
          };
        })
      );
      
      res.json(storiesWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ---------------------------------------------------------------------------
  // Hall of Quills API -------------------------------------------------------
  // ---------------------------------------------------------------------------
  app.get("/api/hall-of-quills/active", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 3;
      const creators = await supabaseStorage.getTopCreators(limit);
      const writers = creators.map((c) => ({
        id: c.id,
        name: c.username,
        title: `${c.comics_count} published works`,
        avatar: c.avatar_url || "https://placehold.co/96x96", // fallback avatar
        stories: c.comics_count,
        reads: "-", // not tracked yet
      }));
      res.json(writers);
    } catch (error) {
      console.error("Hall active writers error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/hall-of-quills/best", async (req, res) => {
    /* For now, reuse top creators (limit 5). Later could rank by ratings */
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
      const creators = await supabaseStorage.getTopCreators(limit);
      const best = creators.map((c) => ({
        id: c.id,
        name: c.username,
        title: `${c.comics_count} published works`,
        avatar: c.avatar_url || "https://placehold.co/96x96",
        stories: c.comics_count,
        reads: "-",
      }));
      res.json(best);
    } catch (error) {
      console.error("Hall best writers error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Placeholder - competitions and honorable mentions arrays held in memory for now
  const competitions: any[] = [];
  const honorable: any[] = [];

  app.get("/api/hall-of-quills/competitions", (_req, res) => {
    res.json(competitions);
  });

  app.get("/api/hall-of-quills/honorable", (_req, res) => {
    res.json(honorable);
  });

  app.post("/api/hall-of-quills/competitions", requireAdmin, (req, res) => {
    const { name, winnerName, storyTitle } = req.body;
    if (!name || !winnerName || !storyTitle) {
      return res.status(400).json({ message: "Missing fields" });
    }
    const entry = {
      id: Date.now(),
      name,
      winner: { name: winnerName, avatar: "https://placehold.co/64x64" },
      storyTitle,
    };
    competitions.unshift(entry);
    res.status(201).json(entry);
  });

  app.post("/api/hall-of-quills/honorable", requireAdmin, (req, res) => {
    const { name, quote } = req.body;
    if (!name || !quote) {
      return res.status(400).json({ message: "Missing fields" });
    }
    const entry = { id: Date.now(), name, quote };
    honorable.unshift(entry);
    res.status(201).json(entry);
  });

  app.get("/api/stories/top-rated", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 4;
      const stories = await supabaseStorage.getTopRatedStories(limit);
      
      // Add genre information to each story
      const storiesWithDetails = await Promise.all(
        stories.map(async (story) => {
          const genres = await supabaseStorage.getStoryGenres(story.id.toString());
          const ratings = await supabaseStorage.getRatings(story.id.toString());
          const author = await supabaseStorage.getUser(story.author_id);
          const rating = await supabaseStorage.getRating(req.user!.id.toString(), story.id.toString());
          // Don't include the full content in list responses
          const { content, ...storyWithoutContent } = story;
          
          return {
            ...storyWithoutContent,
            genres,
            ratingCount: ratings.length,
            author: author ? {
              id: author.id,
              username: author.username,
              fullName: author.full_name,
              avatarUrl: author.avatar_url
            } : null,
            rating
          };
        })
      );
      
      res.json(storiesWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ---------------------------------------------------------------------------
  // Get single TaleCraft project by id
  // ---------------------------------------------------------------------------
  app.get("/api/projects/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
      if (error || !project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      res.json(project);
    } catch (err) {
      console.error('Fetch project error', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // ---------------------------------------------------------------------------
  // TaleCraft project publish route
  // ---------------------------------------------------------------------------
  app.post("/api/projects/publish", requireAuth, async (req: Request, res: Response) => {
    try {
      // Validate and parse body
      const data = taleCraftPublishSchema.parse(req.body);

      // Permission checks for non-admin users
      const isAdmin = !!req.user?.is_admin;
      if (!isAdmin) {
        const publicPages = [
          "adventure",
          "romance",
          "scifi",
          "writers_gems",
          "epic_comics",
        ];
        if (!publicPages.includes(data.page)) {
          return res.status(403).json({ message: "You are not allowed to publish to this page" });
        }
        // Non-admin users can publish to Epic Comics only for comic projects
        if (data.page === "epic_comics" && data.projectType !== "comic") {
          return res.status(400).json({ message: "Epic Comics page is only for comic projects" });
        }
        // Non-admin stories cannot target hekayaty_original (already prevented by schema options)
      }

      // Determine content path depending on format
      const contentPath = data.format === "pdf" ? (req.body.contentPath || data.content) : data.content;

      // Build project record
      const newProject = {
        title: data.title,
        description: data.description,
        coverImage: data.coverImage || "",
        projectType: data.projectType,
        author_id: req.user!.id,
        genre: data.genre,
        page: data.page,
        contentPath,
        isPublished: true,
        isApproved: isAdmin, // auto-approved for admins, true by default else pending moderation logic
        createdAt: new Date().toISOString(),
      } as any;

      const created = await supabaseStorage.createProject(newProject);
      if (!created) {
        return res.status(500).json({ message: "Failed to publish project" });
      }
      res.status(201).json({ id: created.id, url: `/projects/${created.id}` });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Publish project error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Comic publish route
  app.post("/api/comics", requireAuth, async (req: Request, res: Response) => {
    try {
      const comicSchema = z.object({
        title: z.string().min(1),
        description: z.string().min(10),
        pdfUrl: z.string().min(1),
        coverImage: z.string().url().optional(),
        workshopId: z.string().uuid().optional(),
        isPremium: z.boolean().optional(),
        isPublished: z.boolean().optional()
      });
      const data = comicSchema.parse(req.body);

      // Validate workshop ownership if workshopId provided
      if (data.workshopId) {
        const { data: workshop, error: workshopError } = await supabase
          .from('workshops')
          .select('id, owner_id')
          .eq('id', data.workshopId)
          .single();
        if (workshopError || !workshop) {
          return res.status(400).json({ message: 'Invalid workshop_id' });
        }
        if (workshop.owner_id !== req.user!.id) {
          return res.status(403).json({ message: 'You do not own this workshop' });
        }
      }

      const comic = await supabaseStorage.createComic({
        title: data.title,
        description: data.description,
        pdf_url: data.pdfUrl,
        cover_url: data.coverImage,
        author_id: req.user!.id,
        workshop_id: data.workshopId,
        is_premium: data.isPremium || false,
        is_published: data.isPublished || false,
        genre: []
      });

      return res.status(201).json(comic);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Create comic error", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

// Story routes

  app.get("/api/stories/:id", async (req, res) => {
    const storyId = req.params.id;
    if (!storyId) {
      return res.status(400).json({ message: "Invalid story ID" });
    }
    
    const story = await supabaseStorage.getStory(storyId);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    
    // Check if the story is published or the user is the author
    if (!story.is_published && (!req.user?.id || req.user.id !== story.author_id)) {
      return res.status(403).json({ message: "This story is not published yet" });
    }
    
    // Add rating and genre information
    const ratings = await supabaseStorage.getRatings(storyId);
    const avgRating = await supabaseStorage.getAverageRating(storyId);
    const ratingCount = ratings.length;
    const userRating = req.user?.id ? await supabaseStorage.getRating(req.user.id, storyId) : null;
    const genres = await supabaseStorage.getStoryGenres(storyId);
    const author = await supabaseStorage.getUser(story.author_id);
    
    // Check for user bookmark if logged in
    let isBookmarked = false;
    if (req.user?.id) {
      const bookmark = await supabaseStorage.getBookmark(req.params.id, req.user!.id.toString());
      isBookmarked = !!bookmark;
    }
    
    res.json({
      ...story,
      avgRating,
      genres,
      author: author ? {
        id: author.id,
        username: author.username,
        fullName: author.full_name,
        avatarUrl: author.avatar_url,
        bio: author.bio
      } : null,
      ratingCount,
      userRating,
      isBookmarked
    });
  });

  app.put("/api/stories/:id", requireAuth, async (req, res) => {
    const storyId = req.params.id;
    if (!storyId) {
      return res.status(400).json({ message: "Invalid story ID" });
    }
    
    const story = await supabaseStorage.getStory(storyId);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    
    // Verify user is the author
    if (story.author_id !== req.user!.id) {
      return res.status(403).json({ message: "You can only update your own stories" });
    }
    
    try {
      // Allow updating only certain fields
      const updateSchema = z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        content: z.string().optional(),
        coverImage: z.string().optional(),
        isPremium: z.boolean().optional(),
        isPublished: z.boolean().optional(),
      });
      
      const data = updateSchema.parse(req.body);
      const updatedStory = await supabaseStorage.updateStory(storyId, data);
      
      if (!updatedStory) {
        return res.status(404).json({ message: "Story not found" });
      }
      
      res.json(updatedStory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/stories/:id", requireAuth, async (req, res) => {
    const storyId = req.params.id;
    if (!storyId) {
      return res.status(400).json({ message: "Invalid story ID" });
    }
    
    const story = await supabaseStorage.getStory(storyId);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    
    // Verify user is the author
    if (story.author_id !== req.user!.id) {
      return res.status(403).json({ message: "You can only delete your own stories" });
    }
    
    const deleted = await supabaseStorage.deleteStory(storyId);
    if (!deleted) {
      return res.status(500).json({ message: "Failed to delete story" });
    }
    
    res.json({ message: "Story deleted successfully" });
  });

  // ---------------------------------------------------------------------------
  // Story download counter
  // ---------------------------------------------------------------------------
  app.post("/api/stories/:id/download", async (req, res) => {
    const storyId = req.params.id;
    if (!storyId) {
      return res.status(400).json({ message: "Invalid story ID" });
    }

    try {
      // Check if story exists and is published
      const { data: story, error } = await supabase
        .from('stories')
        .select('id, is_published')
        .eq('id', storyId)
        .single();
      if (error || !story) {
        return res.status(404).json({ message: 'Story not found' });
      }
      if (!story.is_published) {
        return res.status(403).json({ message: 'Story is not published' });
      }

      // Increment download_count atomically
      const { error: updateError } = await supabase.rpc('increment_story_downloads', { story_id: storyId });
      if (updateError) {
        console.error('Failed to increment download count via RPC', updateError);
      }

      return res.status(204).send();
    } catch (err) {
      console.error('Download counter error', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Genre routes
  app.get("/api/genres", async (req, res) => {
    try {
      const genres = await supabaseStorage.getAllGenres();
      res.json(genres);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/genres/:id", async (req, res) => {
    try {
      const genreId = parseInt(req.params.id, 10);
      const genre = await supabaseStorage.getGenre(genreId);
      res.json(genre);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Rating routes
  app.post("/api/stories/:id/rate", requireAuth, async (req, res) => {
    const storyId = req.params.id;
    if (!storyId) {
      return res.status(400).json({ message: "Invalid story ID" });
    }
    
    const story = await supabaseStorage.getStory(storyId);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    
    try {
      const data = insertRatingSchema.parse({
        ...req.body,
        userId: req.user!.id,
        storyId
      });
      
      // Check if user already rated
      const existingRating = await supabaseStorage.getRating(data.userId, data.storyId);
      
      let rating;
      if (existingRating) {
        rating = await supabaseStorage.updateRating(existingRating.id, {
          rating: data.rating,
          review: data.review || ''
        });
      } else {
        rating = await supabaseStorage.createRating({
          user_id: data.userId,
          story_id: data.storyId,
          rating: data.rating,
          review: data.review || ''
        });
      }
      
      const averageRating = await supabaseStorage.getAverageRating(storyId);
      
      res.json({
        rating,
        averageRating
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/stories/:id/ratings", async (req, res) => {
    const storyId = req.params.id;
    if (!storyId) {
      return res.status(400).json({ message: "Invalid story ID" });
    }
    
    try {
      const ratings = await supabaseStorage.getRatings(storyId);
      
      // Add user information to each rating
      const ratingsWithUser = await Promise.all(
        ratings.map(async (rating) => {
          const user = await supabaseStorage.getUser(rating.user_id);
          return {
            ...rating,
            user: user ? {
              id: user.id,
              username: user.username,
              fullName: user.full_name,
              avatarUrl: user.avatar_url
            } : null
          };
        })
      );
      
      res.json(ratingsWithUser);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Originals public endpoint
  app.get("/api/originals/:id", async (req, res) => {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ message: "Invalid id" });
    }

    try {
      const story = await supabaseStorage.getStory(id);
      if (!story || !story.is_published) {
        return res.status(404).json({ message: "Story not found" });
      }

      /* Map DB story -> client StoryWorld DTO.
         For now, characters & map placeholders empty; extend later.
      */
      const dto = {
        id: story.id,
        title: story.title,
        posterUrl: story.cover_url || "",
        description: story.description,
        soundtrackUrl: undefined,
        characters: [],
        mapImageUrl: undefined,
      };
      return res.json(dto);
    } catch (error) {
      console.error("Error fetching original story:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Chapters list for an original
  app.get("/api/originals/:id/chapters", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('id, title, summary, cover_url, order')
        .eq('story_id', id)
        .order('order');

      if (error) {
        console.error('Chapters fetch error', error);
        return res.status(500).json({ message: 'Error fetching chapters' });
      }
      const chapters = (data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        summary: row.summary,
        coverUrl: row.cover_url || '',
        unlocked: true,
      }));
      return res.json(chapters);
    } catch (err) {
      console.error('Unexpected error fetching chapters', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Page content for a chapter page
  app.get("/api/originals/:storyId/chapters/:chapterId/pages/:pageNum", async (req, res) => {
    const storyId = parseInt(req.params.storyId, 10);
    const chapterId = parseInt(req.params.chapterId, 10);
    const pageNum = parseInt(req.params.pageNum, 10);
    if ([storyId, chapterId, pageNum].some(Number.isNaN)) {
      return res.status(400).json({ message: "Invalid params" });
    }
    try {
      const { data: pageRow, error } = await supabase
        .from('pages')
        .select('id, banner_url, audio_url, html_content, order')
        .eq('story_id', storyId)
        .eq('chapter_id', chapterId)
        .eq('order', pageNum)
        .single();
      if (error && error.code !== 'PGRST116') {
        console.error('Fetch page error', error);
        return res.status(500).json({ message: 'Error fetching page' });
      }
      if (!pageRow) return res.status(404).json({ message: 'Page not found' });

      // Determine prev / next existence
      const { count } = await supabase
        .from('pages')
        .select('*', { count: 'exact', head: true })
        .eq('story_id', storyId)
        .eq('chapter_id', chapterId);
      const prevPage = pageNum > 1 ? pageNum - 1 : undefined;
      const nextPage = count && pageNum < count ? pageNum + 1 : undefined;

      return res.json({
        id: pageRow.id,
        bannerUrl: pageRow.banner_url || '',
        audioUrl: pageRow.audio_url || '',
        content: pageRow.html_content,
        prevPage,
        nextPage,
      });
    } catch (err) {
      console.error('Unexpected error fetching page', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Users public profile
  app.get("/api/users/:id", async (req, res) => {
    const id = req.params.id;
    try {
      const user = await supabaseStorage.getUser(id);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Followers/following counts placeholder (use relationships table later)
      const followersCount = 0;
      const followingCount = 0;

      const dto = {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        bio: user.bio,
        avatar: user.avatar_url,
        isPremium: user.is_premium,
        isAuthor: user.is_author,
        followersCount,
        followingCount,
        createdAt: user.created_at,
      };
      return res.json(dto);
    } catch (err) {
      console.error('Error fetching user', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Stories list with optional author filter
  app.get("/api/stories", async (req, res) => {
    const { authorId } = req.query as { authorId?: string };
    try {
      const stories = await supabaseStorage.getStories({ authorId });
      return res.json(stories);
    } catch (e) {
      console.error('Error fetching stories', e);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Novels endpoint (assuming supabaseStorage.getStories with is_short_story flag false)
  app.get("/api/novels", async (req, res) => {
    const { authorId } = req.query as { authorId?: string };
    try {
      const novels = await supabaseStorage.getStories({ authorId, isShortStory: false });
      return res.json(novels);
    } catch (e) {
      console.error('Error fetching novels', e);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // User bookmarks (requires auth)
  app.get("/api/bookmarks", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
      const userId = req.user.id;
      const bookmarks = await supabaseStorage.getBookmarks(userId);
      return res.json(bookmarks);
    } catch (e) {
      console.error('Error bookmarks', e);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // User purchases
  app.get("/api/purchases", requireAuth, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
    try {
      const purchases = await supabaseStorage.getUserPurchases(req.user.id);
      return res.json(purchases);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // TalesCraft CRUD endpoints
  app.get("/api/talecraft/story-projects", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
      const projects = await supabaseStorage.getTaleCraftProjects(req.user.id, 'story');
      res.json(projects);
    } catch (error) {
      console.error("Error fetching story projects:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/talecraft/story-projects", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
      const newProject = {
        id: Date.now().toString(),
        title: req.body.title || "Untitled Story",
        type: "story" as const,
        content: req.body.content || "",
        author_id: req.user.id,
        chapters: [],
        pages: [],
        last_modified: new Date().toISOString()
      };
      const created = await supabaseStorage.createTaleCraftProject(newProject);
      res.json(created);
    } catch (error) {
      console.error("Error creating story project:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/talecraft/story-projects/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
      const { id } = req.params;
      const updated = await supabaseStorage.updateTaleCraftProject(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating story project:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/talecraft/story-projects/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
      const { id } = req.params;
      const success = await supabaseStorage.deleteTaleCraftProject(id);
      res.json({ success });
    } catch (error) {
      console.error("Error deleting story project:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Comic projects endpoints
  app.get("/api/talecraft/comic-projects", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
      const projects = await supabaseStorage.getTaleCraftProjects(req.user.id, 'comic');
      res.json(projects);
    } catch (error) {
      console.error("Error fetching comic projects:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/talecraft/comic-projects", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
      const newProject = {
        id: Date.now().toString(),
        title: req.body.title || "Untitled Comic",
        type: "comic" as const,
        content: req.body.content || "",
        author_id: req.user.id,
        chapters: [],
        pages: [],
        last_modified: new Date().toISOString()
      };
      const created = await supabaseStorage.createTaleCraftProject(newProject);
      res.json(created);
    } catch (error) {
      console.error("Error creating comic project:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/talecraft/comic-projects/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
      const { id } = req.params;
      const updated = await supabaseStorage.updateTaleCraftProject(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating comic project:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/talecraft/comic-projects/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
      const { id } = req.params;
      const success = await supabaseStorage.deleteTaleCraftProject(id);
      res.json({ success });
    } catch (error) {
      console.error("Error deleting comic project:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Photo projects endpoints
  app.get("/api/talecraft/photo-projects", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
      const projects = await supabaseStorage.getTaleCraftProjects(req.user.id, 'photo');
      res.json(projects);
    } catch (error) {
      console.error("Error fetching photo projects:", error);
      res.status(500).json({ message: "Failed to fetch photo projects" });
    }
  });

  app.post("/api/talecraft/photo-projects", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
      const newProject = {
        id: Date.now().toString(),
        title: req.body.title || "Untitled Photo Story",
        type: "photo" as const,
        content: req.body.content || "",
        author_id: req.user.id,
        chapters: [],
        pages: [],
        last_modified: new Date().toISOString()
      };
      const created = await supabaseStorage.createTaleCraftProject(newProject);
      res.json(created);
    } catch (error) {
      console.error("Error creating photo project:", error);
      res.status(500).json({ message: "Failed to create photo project" });
    }
  });

  app.patch("/api/talecraft/photo-projects/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
      const { id } = req.params;
      const updated = await supabaseStorage.updateTaleCraftProject(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating photo project:", error);
      res.status(500).json({ message: "Failed to update photo project" });
    }
  });

  app.delete("/api/talecraft/photo-projects/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
      const { id } = req.params;
      const success = await supabaseStorage.deleteTaleCraftProject(id);
      res.json({ success });
    } catch (error) {
      console.error("Error deleting photo project:", error);
      res.status(500).json({ message: "Failed to delete photo project" });
    }
  });

  // TalesCraft publish endpoint
  app.post("/api/talecraft/publish", requireAuth, async (req, res) => {
    try {
      const data = taleCraftPublishSchema.parse(req.body);

      // Role-based page publishing permissions
      if (data.page === "hekayaty_original" && !req.user!.is_admin) {
        return res.status(403).json({ message: "Only admins can publish to Hekayaty Original" });
      }

      // Persist story or comic based on projectType
      if (data.projectType === "story") {
        const newStory = await supabaseStorage.createStory({
          title: data.title,
          description: data.description,
          content: data.content || "",
          cover_url: data.coverImage || undefined,
          author_id: req.user!.id,
          is_premium: data.isPremium,
          is_published: true,
          is_short_story: false,
        });

        if (!newStory) {
          return res.status(500).json({ message: "Failed to create story" });
        }
        return res.status(201).json({ message: "Story published successfully", story: newStory });
      } else {
        // Treat TaleCraft comic export as PDF when format === 'pdf'. Otherwise store without pdf_url.
        const newComic = await supabaseStorage.createComic({
          title: data.title,
          description: data.description,
          cover_url: data.coverImage || undefined,
          pdf_url: data.format === "pdf" ? data.content : undefined,
          author_id: req.user!.id,
          workshop_id: undefined,
          is_premium: data.isPremium,
          isPublished: true,
        } as any);

        if (!newComic) {
          console.error("Failed to create comic", { title: data.title, author_id: req.user!.id });
          return res.status(500).json({ message: "Failed to create comic" });
        }
        return res.status(201).json({ message: "Comic published successfully", comic: newComic });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      } else {
        console.error("Publish error", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Bookmark routes
  app.post("/api/stories/:id/bookmark", requireAuth, async (req, res) => {
    const storyId = req.params.id;
    if (!storyId) {
      return res.status(400).json({ message: "Invalid story ID" });
    }
    
    const story = await supabaseStorage.getStory(storyId);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    
    try {
      const userId = req.user!.id;
      
      // Check if already bookmarked
      const existingBookmark = await supabaseStorage.getBookmark(userId, storyId);
      
      if (existingBookmark) {
        return res.status(400).json({ message: "Story already bookmarked" });
      }
      
      const bookmark = await supabaseStorage.createBookmark({ user_id: userId, story_id: storyId });
      
      res.status(201).json(bookmark);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/stories/:id/bookmark", requireAuth, async (req, res) => {
    const storyId = parseInt(req.params.id, 10);
    if (isNaN(storyId)) {
      return res.status(400).json({ message: "Invalid story ID" });
    }
    
    try {
      const userId = req.user!.id;
      const deleted = await supabaseStorage.deleteBookmark(userId, storyId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Bookmark not found" });
      }
      
      res.json({ message: "Bookmark removed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/bookmarks", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const stories = await supabaseStorage.getBookmarks(userId);
      
      // Add rating and genre information to each story
      const storiesWithDetails = await Promise.all(
        stories.map(async (story) => {
          const averageRating = await supabaseStorage.getAverageRating(story.id.toString());
          const genres = await supabaseStorage.getStoryGenres(story.id.toString());
          const author = await supabaseStorage.getUser(story.author_id);
          
          // Don't include the full content in list responses
          const { content, ...storyWithoutContent } = story;
          
          return {
            ...storyWithoutContent,
            averageRating,
            genres,
            author: author ? {
              id: author.id,
              username: author.username,
              fullName: author.full_name,
              avatarUrl: author.avatar_url
            } : null
          };
        })
      );
      
      res.json(storiesWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Tales of Prophets content endpoints
  app.get("/api/tales-of-prophets", async (req, res) => {
    try {
      const content = await supabaseStorage.getTalesOfProphetsContent();
      res.json(content);
    } catch (error) {
      console.error("Error fetching tales content:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/tales-of-prophets/prophets", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
      const tale = await supabaseStorage.addProphetTale(req.body);
      res.json(tale);
    } catch (error) {
      console.error("Error adding prophet tale:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/tales-of-prophets/companions", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
      const tale = await supabaseStorage.addCompanionTale(req.body);
      res.json(tale);
    } catch (error) {
      console.error("Error adding companion tale:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
