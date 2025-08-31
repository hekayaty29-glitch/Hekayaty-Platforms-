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
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { email, password } = await req.json()

    // Validate required fields
    if (!email || !password) {
      return createErrorResponse('Email and password are required', 400)
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email)

    // Attempt login with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: sanitizedEmail,
      password: password
    })

    if (authError) {
      console.error('Auth login error:', authError)
      return createErrorResponse('Invalid email or password', 401)
    }

    if (!authData.user || !authData.session) {
      return createErrorResponse('Login failed', 401)
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, email, role, subscription_type, avatar_url, created_at')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return createErrorResponse('Failed to fetch user profile', 500)
    }

    // Update last login timestamp
    await supabase
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', authData.user.id)

    return createSuccessResponse({
      message: 'Login successful',
      user: profile,
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return createErrorResponse(error.message || 'Internal server error', 500)
  }
})
