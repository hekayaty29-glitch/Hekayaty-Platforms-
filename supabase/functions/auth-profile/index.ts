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
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get auth header for user identification
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return createErrorResponse('Authorization header required', 401)
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return createErrorResponse('Invalid token', 401)
    }

    const userId = user.id

    if (req.method === 'GET') {
      // Get user profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          id, username, email, full_name, bio
        `)
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Profile fetch error:', error)
        return createErrorResponse('Profile not found', 404)
      }

      return createSuccessResponse({ profile })

    } else if (req.method === 'POST') {
      // Complete profile setup (for new users)
      const { username, fullName } = await req.json()

      if (!username || username.length < 3) {
        return createErrorResponse('Username must be at least 3 characters', 400)
      }

      if (!fullName || fullName.length < 2) {
        return createErrorResponse('Full name is required', 400)
      }

      // Check if username is already taken
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', sanitizeInput(username))
        .single()

      if (existingUser) {
        return createErrorResponse('Username already taken', 400)
      }

      // Create or update profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          username: sanitizeInput(username),
          full_name: sanitizeInput(fullName)
        })
        .select()
        .single()

      if (error) {
        console.error('Profile creation error:', error)
        return createErrorResponse('Failed to create profile', 500)
      }

      return createSuccessResponse({
        message: 'Profile created successfully',
        profile: profile
      })

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


      if (Object.keys(updates).length === 0) {
        return createErrorResponse('No valid fields to update', 400)
      }


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
