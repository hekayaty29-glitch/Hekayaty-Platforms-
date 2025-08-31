import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, createErrorResponse, createSuccessResponse } from '../_shared/utils.ts'
import { verifyJWT } from '../_shared/auth.ts'

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
      .select('id, author_id, title, description, is_published')
      .eq('id', storyId)
      .single()

    if (storyError || !story) {
      return createErrorResponse('Story not found', 404)
    }

    if (story.author_id !== userId) {
      return createErrorResponse('Unauthorized: You can only publish your own stories', 403)
    }

    if (story.is_published) {
      return createErrorResponse('Story is already published', 400)
    }

    // Validate story has required fields for publishing
    if (!story.title || story.title.length < 3) {
      return createErrorResponse('Story must have a title of at least 3 characters to publish', 400)
    }

    if (!story.description || story.description.length < 10) {
      return createErrorResponse('Story must have a description of at least 10 characters to publish', 400)
    }

    // Check if story has at least one chapter
    const { data: chapters, error: chaptersError } = await supabase
      .from('story_chapters')
      .select('id')
      .eq('story_id', storyId)
      .limit(1)

    if (chaptersError || !chapters || chapters.length === 0) {
      return createErrorResponse('Story must have at least one chapter to publish', 400)
    }

    // Get user profile to check limits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, subscription_type')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return createErrorResponse('User profile not found', 404)
    }

    // Check publishing limits for free users
    if (profile.subscription_type === 'free') {
      const { data: publishedStories, error: countError } = await supabase
        .from('stories')
        .select('id')
        .eq('author_id', userId)
        .eq('is_published', true)

      if (countError) {
        console.error('Published stories count error:', countError)
        return createErrorResponse('Failed to check publishing limits', 500)
      }

      const publishedCount = publishedStories?.length || 0
      const maxPublishedStories = 5 // Free users can publish up to 5 stories

      if (publishedCount >= maxPublishedStories) {
        return createErrorResponse(
          `Free users can only publish ${maxPublishedStories} stories. Upgrade to premium for unlimited publishing.`,
          403
        )
      }
    }

    // Publish the story
    const { data: publishedStory, error: publishError } = await supabase
      .from('stories')
      .update({
        is_published: true,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', storyId)
      .select(`
        id, title, description, genre, cover_url,
        is_published, published_at, created_at, updated_at,
        author:profiles(id, username, avatar_url)
      `)
      .single()

    if (publishError) {
      console.error('Story publish error:', publishError)
      return createErrorResponse('Failed to publish story', 500)
    }

    // Update user's published stories count
    await supabase.rpc('increment_user_stories_count', { user_id: userId })

    return createSuccessResponse({
      message: 'Story published successfully',
      story: publishedStory
    })

  } catch (error) {
    console.error('Story publish error:', error)
    return createErrorResponse(error.message || 'Internal server error', 500)
  }
})
