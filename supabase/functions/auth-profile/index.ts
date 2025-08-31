import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, createErrorResponse, createSuccessResponse } from '../_shared/utils.ts'
import { verifyJWT } from '../_shared/auth.ts'
import { validateInput, sanitizeInput } from '../_shared/validation.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify JWT token
    const authResult = await verifyJWT(req)
    if (!authResult.success) {
      return createErrorResponse(authResult.error, 401)
    }

    const userId = authResult.user.sub

    if (req.method === 'GET') {
      // Get user profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          id, username, email, role, subscription_type, 
          avatar_url, bio, created_at, last_login,
          stories_count, followers_count, following_count
        `)
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Profile fetch error:', error)
        return createErrorResponse('Profile not found', 404)
      }

      return createSuccessResponse({ profile })

    } else if (req.method === 'PUT') {
      // Update user profile
      const { username, bio, avatar_url } = await req.json()

      const updates: any = {}

      if (username) {
        if (username.length < 3) {
          return createErrorResponse('Username must be at least 3 characters', 400)
        }

        // Check if username is already taken
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', sanitizeInput(username))
          .neq('id', userId)
          .single()

        if (existingUser) {
          return createErrorResponse('Username already taken', 400)
        }

        updates.username = sanitizeInput(username)
      }

      if (bio !== undefined) {
        updates.bio = sanitizeInput(bio)
      }

      if (avatar_url !== undefined) {
        updates.avatar_url = sanitizeInput(avatar_url)
      }

      if (Object.keys(updates).length === 0) {
        return createErrorResponse('No valid fields to update', 400)
      }

      updates.updated_at = new Date().toISOString()

      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        console.error('Profile update error:', error)
        return createErrorResponse('Failed to update profile', 500)
      }

      return createSuccessResponse({
        message: 'Profile updated successfully',
        profile: updatedProfile
      })

    } else if (req.method === 'DELETE') {
      // Delete user account
      const { password } = await req.json()

      if (!password) {
        return createErrorResponse('Password required for account deletion', 400)
      }

      // Verify password before deletion
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single()

      if (!profile) {
        return createErrorResponse('User not found', 404)
      }

      // Verify password by attempting login
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: password
      })

      if (verifyError) {
        return createErrorResponse('Invalid password', 401)
      }

      // Delete user account
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)

      if (deleteError) {
        console.error('Account deletion error:', deleteError)
        return createErrorResponse('Failed to delete account', 500)
      }

      return createSuccessResponse({ message: 'Account deleted successfully' })

    } else {
      return createErrorResponse('Method not allowed', 405)
    }

  } catch (error) {
    console.error('Profile error:', error)
    return createErrorResponse(error.message || 'Internal server error', 500)
  }
})
