import type { Express, Request, Response } from "express";
import { supabase } from "./supabase-auth";
import { requireAdmin } from "./supabase-auth";

export function registerHallOfQuillsRoutes(app: Express) {
  /**
   * GET /api/hall-of-quills/active?limit=3
   * Returns most active writers (story+comic count desc)
   */
  app.get("/api/hall-of-quills/active", async (req: Request, res: Response) => {
    try {
      const limit = parseInt((req.query.limit as string) || "3", 10);

      // Aggregate total published stories per author
      // Get all published stories and aggregate on the server side
      const { data: stories, error } = await supabase
        .from("stories")
        .select("author_id")
        .eq("is_published", true);

      if (error) throw error;
      if (!stories) return res.json([]);

      // Count stories per author
      const authorCounts = stories.reduce((acc: Record<string, number>, story) => {
        acc[story.author_id] = (acc[story.author_id] || 0) + 1;
        return acc;
      }, {});

      // Sort by count and take top N
      const sortedAuthors = Object.entries(authorCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit);

      // Fetch profile details
      const writers = await Promise.all(
        sortedAuthors.map(async ([authorId, count]) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, username, full_name, avatar_url")
            .eq("id", authorId)
            .single();
          return {
            id: profile?.id,
            name: profile?.username || "Unknown",
            title: profile?.full_name || "Writer",
            avatar: profile?.avatar_url || "https://api.dicebear.com/7.x/initials/svg?seed=" + (profile?.username || "A"),
            stories: count,
            reads: "-",
          };
        })
      );
      res.json(writers);
    } catch (err) {
      console.error("Active writers error", err);
      res.status(500).json({ message: "Failed to load active writers" });
    }
  });

  /**
   * GET /api/hall-of-quills/best?limit=5
   * Returns best writers of current month (highest story count this month)
   */
  app.get("/api/hall-of-quills/best", async (req: Request, res: Response) => {
    try {
      const limit = parseInt((req.query.limit as string) || "5", 10);
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);

      // Get stories from current month and aggregate server-side
      const { data: stories, error } = await supabase
        .from("stories")
        .select("author_id")
        .eq("is_published", true)
        .gte("created_at", firstDayOfMonth.toISOString());

      if (error) throw error;
      if (!stories) return res.json([]);

      // Count stories per author for this month
      const authorCounts = stories.reduce((acc: Record<string, number>, story) => {
        acc[story.author_id] = (acc[story.author_id] || 0) + 1;
        return acc;
      }, {});

      // Sort by count and take top N
      const sortedAuthors = Object.entries(authorCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit);

      const profiles = await Promise.all(
        sortedAuthors.map(async ([authorId, count]) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, username, full_name, avatar_url")
            .eq("id", authorId)
            .single();
          return {
            id: profile?.id,
            name: profile?.username || "Unknown",
            title: profile?.full_name || "Writer",
            avatar: profile?.avatar_url || "https://api.dicebear.com/7.x/initials/svg?seed=" + (profile?.username || "A"),
            stories: count,
            reads: "-",
          };
        })
      );
      res.json(profiles);
    } catch (err) {
      console.error("Best writers error", err);
      res.status(500).json({ message: "Failed to load best writers" });
    }
  });

  /** Competition winners CRUD **/
  app.get("/api/hall-of-quills/competitions", async (_req: Request, res: Response) => {
    const { data, error } = await supabase.from("hall_competitions").select("*").order("created_at", { ascending: false });
    if (error) return res.status(500).json({ message: "Failed to load competitions" });
    res.json(data || []);
  });

  app.post("/api/hall-of-quills/competitions", requireAdmin, async (req: Request, res: Response) => {
    const { name, winnerName, storyTitle, winnerId } = req.body;
    if (!name || !winnerName || !storyTitle) {
      return res.status(400).json({ message: "Missing fields" });
    }
    const { data, error } = await supabase
      .from("hall_competitions")
      .insert({ name, winner_name: winnerName, story_title: storyTitle, winner_id: winnerId || null })
      .select()
      .single();
    if (error) return res.status(500).json({ message: "Failed to add competition" });
    res.json(data);
  });

  /** Honorable mentions CRUD **/
  app.get("/api/hall-of-quills/honorable", async (_req: Request, res: Response) => {
    const { data, error } = await supabase.from("hall_honorable").select("*").order("created_at", { ascending: false });
    if (error) return res.status(500).json({ message: "Failed to load honorable mentions" });
    res.json(data || []);
  });

  app.post("/api/hall-of-quills/honorable", requireAdmin, async (req: Request, res: Response) => {
    const { name, quote } = req.body;
    if (!name || !quote) return res.status(400).json({ message: "Missing fields" });
    const { data, error } = await supabase.from("hall_honorable").insert({ name, quote }).select().single();
    if (error) return res.status(500).json({ message: "Failed to add honorable mention" });
    res.json(data);
  });
}
