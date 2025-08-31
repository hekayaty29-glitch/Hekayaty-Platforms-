import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, createErrorResponse, createSuccessResponse } from '../_shared/utils.ts'
import { validateInput, sanitizeInput } from '../_shared/validation.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return createErrorResponse('Method not allowed', 405)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, password, username } = await req.json()

    // Validate required fields
    if (!email || !password || !username) {
      return createErrorResponse('Email, password, and username are required', 400)
    }

    // Validate input format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return createErrorResponse('Invalid email format', 400)
    }

    if (password.length < 6) {
      return createErrorResponse('Password must be at least 6 characters', 400)
    }

    if (username.length < 3) {
      return createErrorResponse('Username must be at least 3 characters', 400)
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email)
    const sanitizedUsername = sanitizeInput(username)

    // Check if username already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', sanitizedUsername)
      .single()

    if (existingUser) {
      return createErrorResponse('Username already taken', 400)
    }

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: sanitizedEmail,
      password: password,
      options: {
        data: {
          username: sanitizedUsername
        }
      }
    })

    if (authError) {
      console.error('Auth signup error:', authError)
      return createErrorResponse(authError.message, 400)
    }

    if (!authData.user) {
      return createErrorResponse('Failed to create user', 500)
    }

    // Create profile record
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        username: sanitizedUsername,
        email: sanitizedEmail,
        role: 'user',
        subscription_type: 'free',
        created_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      return createErrorResponse('Failed to create user profile', 500)
    }

    return createSuccessResponse({
      message: 'User registered successfully',
      user: {
        id: authData.user.id,
        email: sanitizedEmail,
        username: sanitizedUsername
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    return createErrorResponse(error.message || 'Internal server error', 500)
  }
})
