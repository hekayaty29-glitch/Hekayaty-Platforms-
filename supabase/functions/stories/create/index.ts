import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, verifyAuth, requireAuth, createErrorResponse, createSuccessResponse, createSupabaseClient } from '../../_shared/auth.ts'
import { validateRequest } from '../../_shared/validation.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405)
  }

  try {
    // Verify authentication
    const user = await verifyAuth(req)
    requireAuth(user)

    // Validate request body
    const body = await validateRequest(req, ['title', 'description', 'genre'])
    
    const supabase = await createSupabaseClient()

    // Check if user has reached story limit (for non-premium users)
    if (!user!.is_premium && user!.role === 'free') {
      const { count } = await supabase
        .from('stories')
        .select('id', { count: 'exact', head: true })
        .eq('author_id', user!.id)

      if (count && count >= 5) {
        return createErrorResponse('You have reached the maximum limit of 5 stories. Upgrade to premium for unlimited stories.')
      }
    }

    // Create the story
    const { data: story, error } = await supabase
      .from('stories')
      .insert({
        title: body.title,
        description: body.description,
        genre: body.genre,
        author_id: user!.id,
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
      return createErrorResponse('Failed to create story')
    }

    return createSuccessResponse(story, 201)

  } catch (error) {
    console.error('Story creation error:', error)
    return createErrorResponse(error.message || 'Internal server error', 500)
  }
})
