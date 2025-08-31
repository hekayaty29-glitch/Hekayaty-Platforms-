import type { Express, Request, Response } from "express";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service role client for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Simple admin check middleware
const requireAdmin = async (req: Request, res: Response, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('is_admin, role')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData?.is_admin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    (req as any).user = user;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
};

export function registerAdminAPI(app: Express) {
  
  // =====================================================
  // ADMIN DASHBOARD STATS
  // =====================================================
  
  app.get('/api/admin/stats', requireAdmin, async (req: Request, res: Response) => {
    try {
      // Get user counts
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('role, subscription_type, is_banned')
        .neq('is_banned', true);

      // Get story counts
      const { data: stories } = await supabaseAdmin
        .from('stories')
        .select('is_published, created_at')
        .eq('is_published', true);

      // Mock revenue for now
      const revenue_month = Math.floor(Math.random() * 10000) + 5000;

      const stats = {
        users: users?.length || 0,
        travelers: users?.filter(u => u.subscription_type !== 'free').length || 0,
        lords: users?.filter(u => u.role === 'admin').length || 0,
        stories: stories?.length || 0,
        revenue_month
      };

      res.json(stats);
    } catch (error) {
      console.error('Stats error:', error);
      res.status(500).json({ message: 'Failed to fetch stats' });
    }
  });

  // =====================================================
  // USER MANAGEMENT
  // =====================================================
  
  app.get('/api/admin/users', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { data: users, error } = await supabaseAdmin
        .from('users')
        .select('id, username, email, full_name, role, is_banned, ban_reason, created_at, last_login')
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json(users);
    } catch (error) {
      console.error('Users fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.patch('/api/admin/users/:id/ban', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { banned, reason } = req.body;

      const { data, error } = await supabaseAdmin
        .from('users')
        .update({
          is_banned: banned,
          ban_reason: banned ? reason : null,
          banned_until: banned ? null : null
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error('Ban user error:', error);
      res.status(500).json({ message: 'Failed to update user ban status' });
    }
  });

  // =====================================================
  // STORY MANAGEMENT
  // =====================================================
  
  app.get('/api/admin/stories', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { data: stories, error } = await supabaseAdmin
        .from('stories')
        .select(`
          id, title, description, is_published, created_at, updated_at,
          author:users(id, username, full_name),
          view_count, like_count, download_count
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json(stories);
    } catch (error) {
      console.error('Stories fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch stories' });
    }
  });

  app.patch('/api/admin/stories/:id/publish', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { published } = req.body;

      const { data, error } = await supabaseAdmin
        .from('stories')
        .update({
          is_published: published,
          published_at: published ? new Date().toISOString() : null
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error('Publish story error:', error);
      res.status(500).json({ message: 'Failed to update story publish status' });
    }
  });

  app.delete('/api/admin/stories/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const { error } = await supabaseAdmin
        .from('stories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      res.json({ message: 'Story deleted successfully' });
    } catch (error) {
      console.error('Delete story error:', error);
      res.status(500).json({ message: 'Failed to delete story' });
    }
  });

  // =====================================================
  // SUBSCRIPTION CODE MANAGEMENT
  // =====================================================
  
  app.get('/api/admin/subscription-codes', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { data: codes, error } = await supabaseAdmin
        .from('subscription_codes')
        .select(`
          id, code, subscription_type, is_used, expires_at, created_at,
          used_by:users(username, full_name),
          created_by:users!subscription_codes_created_by_fkey(username, full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json(codes);
    } catch (error) {
      console.error('Codes fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch subscription codes' });
    }
  });

  app.post('/api/admin/subscription-codes', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { subscription_type, quantity = 1, expires_days = 30 } = req.body;
      const user = (req as any).user;
      
      // Get admin user ID
      const { data: adminUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      const codes = [];
      for (let i = 0; i < quantity; i++) {
        const code = Math.random().toString(36).substring(2, 15).toUpperCase();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expires_days);

        codes.push({
          code,
          subscription_type,
          expires_at: expiresAt.toISOString(),
          created_by: adminUser?.id
        });
      }

      const { data, error } = await supabaseAdmin
        .from('subscription_codes')
        .insert(codes)
        .select();

      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error('Create codes error:', error);
      res.status(500).json({ message: 'Failed to create subscription codes' });
    }
  });

  // =====================================================
  // NEWS MANAGEMENT
  // =====================================================
  
  app.get('/api/admin/news', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { type = 'general' } = req.query;
      
      const { data: news, error } = await supabaseAdmin
        .from('news_articles')
        .select(`
          id, title, content, type, is_published, published_at, created_at,
          author:users(id, username, full_name)
        `)
        .eq('type', type)
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json(news);
    } catch (error) {
      console.error('News fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch news' });
    }
  });

  app.post('/api/admin/news', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { title, content, type = 'general' } = req.body;
      const user = (req as any).user;
      
      // Get admin user ID
      const { data: adminUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      const { data, error } = await supabaseAdmin
        .from('news_articles')
        .insert({
          title,
          content,
          type,
          author_id: adminUser?.id,
          is_published: true,
          published_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error('Create news error:', error);
      res.status(500).json({ message: 'Failed to create news article' });
    }
  });

  app.delete('/api/admin/news/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const { error } = await supabaseAdmin
        .from('news_articles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      res.json({ message: 'News article deleted successfully' });
    } catch (error) {
      console.error('Delete news error:', error);
      res.status(500).json({ message: 'Failed to delete news article' });
    }
  });

  // =====================================================
  // LEGENDARY CHARACTERS MANAGEMENT
  // =====================================================
  
  app.get('/api/admin/legendary-characters', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { data: characters, error } = await supabaseAdmin
        .from('legendary_characters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json(characters);
    } catch (error) {
      console.error('Characters fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch legendary characters' });
    }
  });

  app.post('/api/admin/legendary-characters', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { name, photo_url, short_description, full_bio, role, origin, powers } = req.body;

      const { data, error } = await supabaseAdmin
        .from('legendary_characters')
        .insert({
          name,
          photo_url,
          short_description,
          full_bio,
          role,
          origin,
          powers
        })
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error('Create character error:', error);
      res.status(500).json({ message: 'Failed to create legendary character' });
    }
  });

  app.put('/api/admin/legendary-characters/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, photo_url, short_description, full_bio, role, origin, powers } = req.body;

      const { data, error } = await supabaseAdmin
        .from('legendary_characters')
        .update({
          name,
          photo_url,
          short_description,
          full_bio,
          role,
          origin,
          powers
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error('Update character error:', error);
      res.status(500).json({ message: 'Failed to update legendary character' });
    }
  });

  app.delete('/api/admin/legendary-characters/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const { error } = await supabaseAdmin
        .from('legendary_characters')
        .delete()
        .eq('id', id);

      if (error) throw error;
      res.json({ message: 'Legendary character deleted successfully' });
    } catch (error) {
      console.error('Delete character error:', error);
      res.status(500).json({ message: 'Failed to delete legendary character' });
    }
  });
}
