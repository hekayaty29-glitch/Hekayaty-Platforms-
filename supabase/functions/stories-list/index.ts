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
        id, title, description, cover_image_url, 
        created_at, updated_at, is_published,
        author:users!stories_author_id_fkey(id, username, avatar_url),
        story_genres(genres(id, name))
      `)
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (featured) {
      // Featured stories could be based on views or likes
      query = query.order('views_count', { ascending: false })
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
      const authorData = story.author as any
      const genres = story.story_genres?.map((sg: any) => sg.genres) || []

      return {
        id: story.id,
        title: story.title,
        description: story.description,
        genres: genres,
        coverUrl: story.cover_image_url,
        created_at: story.created_at,
        updated_at: story.updated_at,
        author: {
          id: Array.isArray(authorData) ? authorData[0]?.id : authorData?.id,
          fullName: Array.isArray(authorData) ? authorData[0]?.username : authorData?.username,
          avatarUrl: Array.isArray(authorData) ? authorData[0]?.avatar_url : authorData?.avatar_url
        },
        averageRating: 0,
        ratingCount: 0
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
