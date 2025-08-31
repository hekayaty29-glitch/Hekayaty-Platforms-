import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, createErrorResponse, createSuccessResponse } from '../_shared/utils.ts'
import { verifyJWT } from '../_shared/auth.ts'
import { validateInput, sanitizeInput } from '../_shared/validation.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405)
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

    // Parse and validate request body
    const body = await req.json()
    const { title, description, genre } = body

    if (!title || !description || !genre) {
      return createErrorResponse('Title, description, and genre are required', 400)
    }

    // Sanitize inputs
    const sanitizedTitle = sanitizeInput(title)
    const sanitizedDescription = sanitizeInput(description)
    const sanitizedGenre = sanitizeInput(genre)

    // Validate inputs
    if (!validateInput(sanitizedTitle) || !validateInput(sanitizedDescription) || !validateInput(sanitizedGenre)) {
      return createErrorResponse('Invalid input detected', 400)
    }

    // Get user profile to check subscription status
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_type')
      .eq('id', userId)
      .single()

    // Check if user has reached story limit (for non-premium users)
    if (!profile || profile.subscription_type === 'free') {
      const { count } = await supabase
        .from('stories')
        .select('id', { count: 'exact', head: true })
        .eq('author_id', userId)

      if (count && count >= 5) {
        return createErrorResponse('You have reached the maximum limit of 5 stories. Upgrade to premium for unlimited stories.', 403)
      }
    }

    // Create the story
    const { data: story, error } = await supabase
      .from('stories')
      .insert({
        title: sanitizedTitle,
        description: sanitizedDescription,
        genre: sanitizedGenre,
        author_id: userId,
        is_published: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(`
        *,
        author:profiles(id, username, full_name, avatar_url)
      `)
      .single()

    if (error) {
      console.error('Story creation error:', error)
      return createErrorResponse('Failed to create story', 500)
    }

    return createSuccessResponse(story, 201)

  } catch (error) {
    console.error('Story creation error:', error)
    return createErrorResponse(error.message || 'Internal server error', 500)
  }
})
