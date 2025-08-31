import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, verifyAuth, requireAdmin, createErrorResponse, createSuccessResponse, createSupabaseClient } from '../../_shared/auth.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'GET') {
    return createErrorResponse('Method not allowed', 405)
  }

  try {
    // Verify admin authentication
    const user = await verifyAuth(req)
    requireAdmin(user)

    const supabase = await createSupabaseClient()

    // Get user counts by role
    const { data: userStats, error: userError } = await supabase
      .from('profiles')
      .select('role')

    if (userError) {
      console.error('User stats error:', userError)
      return createErrorResponse('Failed to fetch user statistics')
    }

    // Count users by role
    const userCounts = userStats.reduce((acc: any, user: any) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    }, {})

    // Get story count
    const { count: storyCount, error: storyError } = await supabase
      .from('stories')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', true)

    if (storyError) {
      console.error('Story stats error:', storyError)
      return createErrorResponse('Failed to fetch story statistics')
    }

    // Get recent users (last 10)
    const { data: recentUsers, error: recentUsersError } = await supabase
      .from('profiles')
      .select('id, username, email, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (recentUsersError) {
      console.error('Recent users error:', recentUsersError)
    }

    // Get recent stories (last 10)
    const { data: recentStories, error: recentStoriesError } = await supabase
      .from('stories')
      .select(`
        id, 
        title, 
        created_at,
        author:profiles(username)
      `)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(10)

    if (recentStoriesError) {
      console.error('Recent stories error:', recentStoriesError)
    }

    // Calculate revenue (mock data for now - implement based on your payment system)
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const revenueMonth = 0 // Implement based on your subscription/payment tracking

    const stats = {
      users: userCounts.free + userCounts.premium + userCounts.admin || 0,
      travelers: userCounts.free || 0,
      lords: userCounts.premium || 0,
      stories: storyCount || 0,
      revenue_month: revenueMonth,
      recentUsers: recentUsers?.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email
      })) || [],
      recentStories: recentStories?.map(story => ({
        id: story.id,
        title: story.title,
        author: (story.author as any)?.username || 'Unknown'
      })) || []
    }

    return createSuccessResponse(stats)

  } catch (error) {
    console.error('Admin stats error:', error)
    return createErrorResponse(error.message || 'Internal server error', 500)
  }
})
