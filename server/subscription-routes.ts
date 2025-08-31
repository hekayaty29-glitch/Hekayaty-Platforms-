import { Express, Request, Response } from "express";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { supabaseStorage } from "./supabase-storage";
import { sendVipCodeEmail } from "./emailService";
import { requireAuth } from "./supabase-auth";

// Free-code promotion ends 1 Nov 2025 (UTC)
const FREE_CODE_END = new Date("2025-11-01T00:00:00Z");

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRole);

function generateCode(length = 8): string {
  return Array.from({ length }, () =>
    Math.floor(Math.random() * 36).toString(36).toUpperCase()
  ).join("");
}

export function registerSubscriptionRoutes(app: Express) {

  /**
   * POST /api/subscriptions/free
   * Body: { email }
   */
  app.post("/api/subscriptions/free", async (req: Request, res: Response) => {
    // End the promo after cutoff date
    if (new Date() >= FREE_CODE_END) {
      return res.status(410).json({ message: "The free 2-month promotion has ended." });
    }

    const bodySchema = z.object({ email: z.string().email() });
    const parse = bodySchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ message: "Invalid email" });
    }
    const email = parse.data.email.toLowerCase();

    // Get user by email via existing storage helper
    const user = await supabaseStorage.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days

    // Persist in subscription_codes table
    const { error } = await supabase.from("subscription_codes").insert([
      {
        code,
        subscription_type: '2_month',
        created_by: null,
        expires_at: expiresAt.toISOString(),
        is_used: false,
        is_special_2month: true,
      },
    ]);
    if (error) {
      console.error("Failed to insert code", error);
      return res.status(500).json({ message: "Failed to generate code" });
    }

    // Send VIP code email via Resend
    try {
      await sendVipCodeEmail({
        to: email,
        code,
        expiresAt: expiresAt.toISOString(),
        paid: false,
      });
    } catch (mailErr) {
      console.error('Failed to send VIP email', mailErr);
      // continue; don't block user getting code
    }

    res.json({ message: 'VIP code sent via email' });
  });

  /**
   * POST /api/subscriptions/redeem
   * Body: { email, code }
   */
  app.post("/api/subscriptions/redeem", async (req: Request, res: Response) => {
    const bodySchema = z.object({
      email: z.string().email(),
      code: z.string().min(6),
    });
    const parse = bodySchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ message: "Invalid payload" });
    }
    const { email, code } = parse.data;

    // Get user
    const user = await supabaseStorage.getUserByEmail(email.toLowerCase());
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent multiple redemptions of free promo per user
    const { count: redeemedCount } = await supabase
      .from("subscription_codes")
      .select("id", { head: true, count: "exact" })
      .eq("used_by", user.id)
      .eq("is_special_2month", true);

    if (redeemedCount && redeemedCount > 0) {
      return res.status(400).json({ message: "You have already redeemed your free code." });
    }

    // Fetch code row
    const { data, error } = await supabase
      .from("subscription_codes")
      .select("*")
      .eq("code", code.toUpperCase())
      .single();

    if (error || !data) {
      return res.status(404).json({ message: "Code not found" });
    }

    if (data.is_used) {
      return res.status(400).json({ message: "Code already redeemed" });
    }

    if (new Date(data.expires_at) < new Date()) {
      return res.status(400).json({ message: "Code expired" });
    }

    // Mark user premium for 60 days
    const premiumUntil = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    await supabaseStorage.updateUser(user.id, { is_premium: true });

    // Update code row
    await supabase
      .from("subscription_codes")
      .update({ is_used: true, used_at: new Date().toISOString(), used_by: user.id })
      .eq("id", data.id);

    return res.json({ message: "Subscription activated", premium_until: premiumUntil.toISOString() });
  });
}
