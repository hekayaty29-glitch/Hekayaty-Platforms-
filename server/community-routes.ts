import { Express, Request, Response } from "express";
import { requireAuth } from "./supabase-auth";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export function registerCommunityRoutes(app: Express) {
  // Helper to get user id from req, assumes verifySupabaseToken already ran
  const getCurrentUser = (req: Request) => req.user?.id as string | undefined;

  // List workshops (optionally only current user's)
  app.get("/api/community/workshops", requireAuth, async (req: Request, res: Response) => {
    try {
      const mine = req.query.mine === '1';
      const userId = getCurrentUser(req);

      const query = supabase.from('workshops').select("*");
      if (mine && userId) {
        query.eq('owner_id', userId);
      }
      const { data: workshops, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      res.json(workshops);
    } catch (error) {
      console.error('Error fetching workshops:', error);
      res.status(500).json({ message: 'Failed to fetch workshops' });
    }
  });

  // Create workshop
  app.post("/api/community/workshops", requireAuth, async (req: Request, res: Response) => {
    try {
      console.log('🔧 Workshop creation started');
      console.log('📝 Request body:', req.body);
      
      const schema = z.object({
        name: z.string().min(1).max(255),
        description: z.string().min(1).max(1000),
      });

      const { name, description } = schema.parse(req.body);
      const userId = getCurrentUser(req);
      
      console.log('👤 User ID:', userId);
      console.log('📋 Workshop data:', { name, description });

      if (!userId) {
        console.log('❌ User not authenticated');
        return res.status(401).json({ message: 'User not authenticated' });
      }

      console.log('💾 Attempting to insert workshop into database...');
      
      // Use the correct column names for the workshops table
      const now = new Date();
      const defaultEndTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
      
      let insertData: any = {
        title: name,  // workshops table requires title column
        name: name,   // workshops table also requires name column
        description,
        creator_id: userId,
        is_active: true,
        starts_at: now.toISOString(), // Required field - set to current time as default
        ends_at: defaultEndTime.toISOString(), // Required field - set to 2 hours from start
        created_at: now.toISOString()
      };

      console.log('✅ Using title and creator_id columns');

      console.log('📊 Final insert data:', insertData);

      const { data, error } = await supabase
        .from('workshops')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.log('💥 Database error:', error);
        console.log('🔍 Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      
      console.log('✅ Workshop created successfully:', data);
      res.json(data);
    } catch (error) {
      console.error('🚨 Workshop creation failed:', error);
      if (error instanceof z.ZodError) {
        console.log('📝 Validation errors:', error.errors);
        return res.status(400).json({ message: 'Validation failed', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create workshop' });
    }
  });

  // List posts
  app.get("/api/community/posts", async (_req: Request, res: Response) => {
    try {
      const userId = getCurrentUser(_req);
      
      // Get posts with like counts and user's like status
      const { data: posts, error: postsError } = await supabase
        .from('community_posts')
        .select(`
          *,
          community_post_likes!left(count),
          user_liked:community_post_likes!left(user_id)
        `)
        .eq('user_liked.user_id', userId)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Transform the data to include like counts and user like status
      const transformedPosts = posts?.map(post => ({
        ...post,
        like_count: post.community_post_likes?.[0]?.count || 0,
        user_has_liked: post.user_liked?.length > 0
      })) || [];

      res.json(transformedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({ message: 'Failed to fetch posts' });
    }
  });

  // Create post
  app.post("/api/community/posts", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        title: z.string().min(1).max(200),
        body: z.string().min(1).max(5000),
        tags: z.array(z.string()).optional().default([]),
      });

      const { title, body, tags } = schema.parse(req.body);
      const user_id = getCurrentUser(req);

      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          title,
          body,
          tags,
          user_id,
        })
        .select()
        .single();

      if (error) throw error;
      res.status(201).json(data);
    } catch (error) {
      console.error('Error creating post:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid input', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to create post' });
      }
    }
  });

  // Like/unlike a post
  app.post("/api/community/posts/:id/like", async (req: Request, res: Response) => {
    try {
      const postId = req.params.id;
      const userId = getCurrentUser(req);

      // Check if user already liked this post
      const { data: existingLike, error: checkError } = await supabase
        .from('community_post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingLike) {
        // Unlike: Remove the like
        const { error: deleteError } = await supabase
          .from('community_post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);

        if (deleteError) throw deleteError;
        res.json({ liked: false, message: 'Post unliked' });
      } else {
        // Like: Add the like
        const { error: insertError } = await supabase
          .from('community_post_likes')
          .insert({ post_id: postId, user_id: userId });

        if (insertError) throw insertError;
        res.json({ liked: true, message: 'Post liked' });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      res.status(500).json({ message: 'Failed to toggle like' });
    }
  });

  // Get comments for a post
  app.get("/api/community/posts/:id/comments", async (req: Request, res: Response) => {
    try {
      const postId = req.params.id;
      const userId = getCurrentUser(req);

      const { data: comments, error } = await supabase
        .from('community_post_comments')
        .select(`
          *,
          community_comment_likes!left(count),
          user_liked:community_comment_likes!left(user_id)
        `)
        .eq('post_id', postId)
        .eq('user_liked.user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Transform the data to include like counts and user like status
      const transformedComments = comments?.map(comment => ({
        ...comment,
        like_count: comment.community_comment_likes?.[0]?.count || 0,
        user_has_liked: comment.user_liked?.length > 0
      })) || [];

      res.json(transformedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ message: 'Failed to fetch comments' });
    }
  });

  // Add comment to a post
  app.post("/api/community/posts/:id/comments", async (req: Request, res: Response) => {
    try {
      const postId = req.params.id;
      const userId = getCurrentUser(req);
      
      const schema = z.object({
        content: z.string().min(1).max(1000),
      });

      const { content } = schema.parse(req.body);

      const { data, error } = await supabase
        .from('community_post_comments')
        .insert({
          post_id: postId,
          user_id: userId,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      res.status(201).json(data);
    } catch (error) {
      console.error('Error creating comment:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid input', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to create comment' });
      }
    }
  });

  // Like/unlike a comment
  app.post("/api/community/comments/:id/like", async (req: Request, res: Response) => {
    try {
      const commentId = req.params.id;
      const userId = getCurrentUser(req);

      // Check if user already liked this comment
      const { data: existingLike, error: checkError } = await supabase
        .from('community_comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingLike) {
        // Unlike: Remove the like
        const { error: deleteError } = await supabase
          .from('community_comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', userId);

        if (deleteError) throw deleteError;
        res.json({ liked: false, message: 'Comment unliked' });
      } else {
        // Like: Add the like
        const { error: insertError } = await supabase
          .from('community_comment_likes')
          .insert({ comment_id: commentId, user_id: userId });

        if (insertError) throw insertError;
        res.json({ liked: true, message: 'Comment liked' });
      }
    } catch (error) {
      console.error('Error toggling comment like:', error);
      res.status(500).json({ message: 'Failed to toggle comment like' });
    }
  });

  // Delete a post (owner only)
  app.delete("/api/community/posts/:id", async (req: Request, res: Response) => {
    try {
      const postId = req.params.id;
      const userId = getCurrentUser(req);

      // Ensure the post belongs to user (or future: check admin)
      const { data: post, error: fetchErr } = await supabase
        .from('community_posts')
        .select('user_id')
        .eq('id', postId)
        .single();

      if (fetchErr) throw fetchErr;
      if (!post || post.user_id !== userId) {
        return res.status(403).json({ message: 'Not permitted to delete this post' });
      }

      const { error: deleteErr } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId);

      if (deleteErr) throw deleteErr;
      res.json({ message: 'Post deleted' });
    } catch (error) {
      console.error('Error deleting post:', error);
      res.status(500).json({ message: 'Failed to delete post' });
    }
  });

  // Delete a comment (owner only)
  app.delete("/api/community/comments/:id", async (req: Request, res: Response) => {
    try {
      const commentId = req.params.id;
      const userId = getCurrentUser(req);

      const { data: comment, error: fetchErr } = await supabase
        .from('community_post_comments')
        .select('user_id')
        .eq('id', commentId)
        .single();

      if (fetchErr) throw fetchErr;
      if (!comment || comment.user_id !== userId) {
        return res.status(403).json({ message: 'Not permitted to delete this comment' });
      }

      const { error: deleteErr } = await supabase
        .from('community_post_comments')
        .delete()
        .eq('id', commentId);

      if (deleteErr) throw deleteErr;
      res.json({ message: 'Comment deleted' });
    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({ message: 'Failed to delete comment' });
    }
  });
}
