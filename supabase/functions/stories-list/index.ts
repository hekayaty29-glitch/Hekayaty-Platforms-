import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, createErrorResponse, createSuccessResponse } from '../_shared/utils.ts'

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
    const genre = url.searchParams.get('genre')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const search = url.searchParams.get('search')
    const featured = url.searchParams.get('featured') === 'true'

    // Build query
    let query = supabase
      .from('stories')
      .select(`
        id, title, description, genre, cover_url, 
        created_at, updated_at,
        author:profiles!stories_author_id_fkey(id, username, avatar_url),
        ratings:story_ratings(rating),
        bookmarks:story_bookmarks(id)
      `)
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    // Apply filters
    if (genre) {
      query = query.eq('genre', genre)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (featured) {
      // Featured stories could be based on ratings or bookmarks
      query = query.order('created_at', { ascending: false })
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: stories, error } = await query

    if (error) {
      console.error('Database error:', error)
      return createErrorResponse('Failed to fetch stories', 500)
    }

    // Process stories data
    const processedStories = (stories || []).map((story: any) => {
      const ratings = story.ratings || []
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length 
        : 0

      const authorData = story.author as any

      return {
        id: story.id,
        title: story.title,
        description: story.description,
        genre: story.genre,
        cover_url: story.cover_url,
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
        }
      }
    })

    return createSuccessResponse({
      stories: processedStories,
      pagination: {
        limit,
        offset,
        total: processedStories.length
      }
    })

  } catch (error) {
    console.error('Stories list error:', error)
    return createErrorResponse('Internal server error', 500)
  }
})
