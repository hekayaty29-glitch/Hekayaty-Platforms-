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
    if (req.method !== 'PUT') {
      return createErrorResponse('Method not allowed', 405)
    }

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
    const url = new URL(req.url)
    const storyId = url.pathname.split('/').pop()

    if (!storyId) {
      return createErrorResponse('Story ID is required', 400)
    }

    // Check if user owns the story
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('id, author_id, is_published')
      .eq('id', storyId)
      .single()

    if (storyError || !story) {
      return createErrorResponse('Story not found', 404)
    }

    if (story.author_id !== userId) {
      return createErrorResponse('Unauthorized: You can only update your own stories', 403)
    }

    const { title, description, genre, cover_url } = await req.json()

    const updates: any = {}

    if (title) {
      if (title.length < 3) {
        return createErrorResponse('Title must be at least 3 characters', 400)
      }
      updates.title = sanitizeInput(title)
    }

    if (description !== undefined) {
      updates.description = sanitizeInput(description)
    }

    if (genre) {
      const validGenres = [
        'fantasy', 'sci-fi', 'romance', 'mystery', 'thriller', 
        'horror', 'adventure', 'drama', 'comedy', 'historical',
        'young-adult', 'non-fiction', 'poetry', 'other'
      ]
      if (!validGenres.includes(genre)) {
        return createErrorResponse('Invalid genre', 400)
      }
      updates.genre = genre
    }

    if (cover_url !== undefined) {
      updates.cover_url = sanitizeInput(cover_url)
    }

    if (Object.keys(updates).length === 0) {
      return createErrorResponse('No valid fields to update', 400)
    }

    updates.updated_at = new Date().toISOString()

    const { data: updatedStory, error: updateError } = await supabase
      .from('stories')
      .update(updates)
      .eq('id', storyId)
      .select(`
        id, title, description, genre, cover_url,
        is_published, created_at, updated_at,
        author:profiles(id, username, avatar_url)
      `)
      .single()

    if (updateError) {
      console.error('Story update error:', updateError)
      return createErrorResponse('Failed to update story', 500)
    }

    return createSuccessResponse({
      message: 'Story updated successfully',
      story: updatedStory
    })

  } catch (error) {
    console.error('Story update error:', error)
    return createErrorResponse(error.message || 'Internal server error', 500)
  }
})
