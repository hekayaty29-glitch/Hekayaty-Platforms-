import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, createErrorResponse, createSuccessResponse } from '../_shared/utils.ts'
import { verifyJWT } from '../_shared/auth.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'GET') {
      return createErrorResponse('Method not allowed', 405)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const url = new URL(req.url)
    const storyId = url.pathname.split('/').pop()
    const includeChapters = url.searchParams.get('chapters') === 'true'

    if (!storyId) {
      return createErrorResponse('Story ID is required', 400)
    }

    // Get story details with author info
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select(`
        id, title, description, genre, cover_url, 
        is_published, created_at, updated_at, author_id,
        author:profiles!stories_author_id_fkey(id, username, avatar_url),
        ratings:story_ratings(rating),
        bookmarks:story_bookmarks(id)
      `)
      .eq('id', storyId)
      .single()

    if (storyError || !story) {
      return createErrorResponse('Story not found', 404)
    }

    // Check if story is published or if user is the author
    let isAuthor = false
    const authResult = await verifyJWT(req)
    if (authResult.success) {
      const userId = authResult.user.sub
      const authorData = story.author as any
      isAuthor = Array.isArray(authorData) ? authorData[0]?.id === userId : authorData?.id === userId
    }

    if (!story.is_published && !isAuthor) {
      return createErrorResponse('Story not found', 404)
    }

    // Calculate average rating
    const ratings = story.ratings || []
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length 
      : 0

    // Get chapters if requested
    let chapters = undefined
    if (includeChapters) {
      const { data: chaptersData } = await supabase
        .from('story_chapters')
        .select('id, title, content, chapter_number, created_at')
        .eq('story_id', storyId)
        .order('chapter_number')
      
      chapters = chaptersData || []
    }

    const authorData = story.author as any
    const response = {
      id: story.id,
      title: story.title,
      description: story.description,
      genre: story.genre,
      cover_url: story.cover_url,
      is_published: story.is_published,
      created_at: story.created_at,
      updated_at: story.updated_at,
      author: {
        id: Array.isArray(authorData) ? authorData[0]?.id : authorData?.id,
        username: Array.isArray(authorData) ? authorData[0]?.username : authorData?.username,
        avatar_url: Array.isArray(authorData) ? authorData[0]?.avatar_url : authorData?.avatar_url
      },
      stats: {
        average_rating: Math.round(averageRating * 10) / 10,
        total_ratings: ratings.length,
        total_bookmarks: story.bookmarks?.length || 0
      },
      chapters: includeChapters ? chapters : undefined,
      is_author: isAuthor
    }

    return createSuccessResponse(response)

  } catch (error) {
    console.error('Story read error:', error)
    return createErrorResponse(error.message || 'Internal server error', 500)
  }
})
