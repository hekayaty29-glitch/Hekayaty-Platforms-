import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, createErrorResponse, createSuccessResponse } from '../_shared/utils.ts'
import { verifyJWT, requireAdminRole } from '../_shared/auth.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify JWT and admin role
    const authResult = await verifyJWT(req)
    if (!authResult.success) {
      return createErrorResponse(authResult.error, 401)
    }

    const adminCheck = await requireAdminRole(supabase, authResult.user.sub)
    if (!adminCheck.success) {
      return createErrorResponse(adminCheck.error, 403)
    }

    const url = new URL(req.url)
    const userId = url.pathname.split('/').pop()

    if (req.method === 'GET') {
      if (userId && userId !== 'admin-users') {
        // Get specific user
        const { data: user, error } = await supabase
          .from('profiles')
          .select(`
            id, username, email, role, subscription_type,
            avatar_url, bio, created_at, last_login,
            stories_count, followers_count, following_count,
            is_banned, ban_reason, banned_at
          `)
          .eq('id', userId)
          .single()

        if (error || !user) {
          return createErrorResponse('User not found', 404)
        }

        return createSuccessResponse({ user })
      } else {
        // Get all users with pagination and filters
        const page = parseInt(url.searchParams.get('page') || '1')
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)
        const search = url.searchParams.get('search')
        const role = url.searchParams.get('role')
        const subscription = url.searchParams.get('subscription')
        const banned = url.searchParams.get('banned')

        let query = supabase
          .from('profiles')
          .select(`
            id, username, email, role, subscription_type,
            avatar_url, created_at, last_login,
            stories_count, is_banned, banned_at
          `, { count: 'exact' })

        if (search) {
          query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`)
        }

        if (role) {
          query = query.eq('role', role)
        }

        if (subscription) {
          query = query.eq('subscription_type', subscription)
        }

        if (banned === 'true') {
          query = query.eq('is_banned', true)
        } else if (banned === 'false') {
          query = query.eq('is_banned', false)
        }

        const { data: users, error, count } = await query
          .order('created_at', { ascending: false })
          .range((page - 1) * limit, page * limit - 1)

        if (error) {
          console.error('Users fetch error:', error)
          return createErrorResponse('Failed to fetch users', 500)
        }

        return createSuccessResponse({
          users: users || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            pages: Math.ceil((count || 0) / limit)
          }
        })
      }

    } else if (req.method === 'PUT') {
      // Update user (ban/unban, change role, etc.)
      if (!userId || userId === 'admin-users') {
        return createErrorResponse('User ID is required', 400)
      }

      const { action, role, subscription_type, ban_reason } = await req.json()

      if (action === 'ban') {
        const { error } = await supabase
          .from('profiles')
          .update({
            is_banned: true,
            ban_reason: ban_reason || 'Banned by admin',
            banned_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (error) {
          console.error('User ban error:', error)
          return createErrorResponse('Failed to ban user', 500)
        }

        return createSuccessResponse({ message: 'User banned successfully' })

      } else if (action === 'unban') {
        const { error } = await supabase
          .from('profiles')
          .update({
            is_banned: false,
            ban_reason: null,
            banned_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (error) {
          console.error('User unban error:', error)
          return createErrorResponse('Failed to unban user', 500)
        }

        return createSuccessResponse({ message: 'User unbanned successfully' })

      } else if (action === 'update_role') {
        if (!role || !['user', 'premium', 'admin'].includes(role)) {
          return createErrorResponse('Invalid role', 400)
        }

        const { error } = await supabase
          .from('profiles')
          .update({
            role: role,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (error) {
          console.error('User role update error:', error)
          return createErrorResponse('Failed to update user role', 500)
        }

        return createSuccessResponse({ message: 'User role updated successfully' })

      } else if (action === 'update_subscription') {
        if (!subscription_type || !['free', 'premium', 'vip'].includes(subscription_type)) {
          return createErrorResponse('Invalid subscription type', 400)
        }

        const { error } = await supabase
          .from('profiles')
          .update({
            subscription_type: subscription_type,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (error) {
          console.error('User subscription update error:', error)
          return createErrorResponse('Failed to update user subscription', 500)
        }

        return createSuccessResponse({ message: 'User subscription updated successfully' })

      } else {
        return createErrorResponse('Invalid action', 400)
      }

    } else if (req.method === 'DELETE') {
      // Delete user account (admin only)
      if (!userId || userId === 'admin-users') {
        return createErrorResponse('User ID is required', 400)
      }

      // Delete user from auth and database
      const { error: authError } = await supabase.auth.admin.deleteUser(userId)
      if (authError) {
        console.error('User auth deletion error:', authError)
        return createErrorResponse('Failed to delete user account', 500)
      }

      return createSuccessResponse({ message: 'User account deleted successfully' })

    } else {
      return createErrorResponse('Method not allowed', 405)
    }

  } catch (error) {
    console.error('Admin users error:', error)
    return createErrorResponse(error.message || 'Internal server error', 500)
  }
})
