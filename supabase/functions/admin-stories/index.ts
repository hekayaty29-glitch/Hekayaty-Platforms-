import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, createErrorResponse, createSuccessResponse } from '../_shared/utils.ts'
import { verifyJWT, requireAdminRole } from '../_shared/auth.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify JWT and admin role
    const authResult = await verifyJWT(req)
    if (!authResult.success) {
      return createErrorResponse(authResult.error, 401)
    }

    const adminCheck = await requireAdminRole(supabase, authResult.user.sub)
    if (!adminCheck.success) {
      return createErrorResponse(adminCheck.error, 403)
    }

    const url = new URL(req.url)
    const storyId = url.pathname.split('/').pop()

    if (req.method === 'GET') {
      if (storyId && storyId !== 'admin-stories') {
        // Get specific story with full details
        const { data: story, error } = await supabase
          .from('stories')
          .select(`
            id, title, description, genre, cover_url,
            is_published, created_at, updated_at, published_at,
            author:profiles(id, username, email, avatar_url),
            chapters:story_chapters(id, title, chapter_number, created_at),
            ratings:story_ratings(rating),
            bookmarks:story_bookmarks(id),
            reports:story_reports(id, reason, created_at)
          `)
          .eq('id', storyId)
          .single()

        if (error || !story) {
          return createErrorResponse('Story not found', 404)
        }

        return createSuccessResponse({ story })
      } else {
        // Get all stories with pagination and filters
        const page = parseInt(url.searchParams.get('page') || '1')
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)
        const search = url.searchParams.get('search')
        const genre = url.searchParams.get('genre')
        const published = url.searchParams.get('published')
        const reported = url.searchParams.get('reported')

        let query = supabase
          .from('stories')
          .select(`
            id, title, description, genre, cover_url,
            is_published, created_at, updated_at,
            author:profiles(id, username, avatar_url),
            ratings:story_ratings(rating),
            reports:story_reports(id)
          `, { count: 'exact' })

        if (search) {
          query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
        }

        if (genre) {
          query = query.eq('genre', genre)
        }

        if (published === 'true') {
          query = query.eq('is_published', true)
        } else if (published === 'false') {
          query = query.eq('is_published', false)
        }

        const { data: stories, error, count } = await query
          .order('created_at', { ascending: false })
          .range((page - 1) * limit, page * limit - 1)

        if (error) {
          console.error('Stories fetch error:', error)
          return createErrorResponse('Failed to fetch stories', 500)
        }

        // Filter reported stories if requested
        let filteredStories = stories || []
        if (reported === 'true') {
          filteredStories = filteredStories.filter(story => 
            story.reports && story.reports.length > 0
          )
        }

        return createSuccessResponse({
          stories: filteredStories,
          pagination: {
            page,
            limit,
            total: count || 0,
            pages: Math.ceil((count || 0) / limit)
          }
        })
      }

    } else if (req.method === 'PUT') {
      // Update story (moderate, feature, etc.)
      if (!storyId || storyId === 'admin-stories') {
        return createErrorResponse('Story ID is required', 400)
      }

      const { action, reason } = await req.json()

      if (action === 'unpublish') {
        const { error } = await supabase
          .from('stories')
          .update({
            is_published: false,
            moderation_reason: reason || 'Unpublished by admin',
            moderated_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', storyId)

        if (error) {
          console.error('Story unpublish error:', error)
          return createErrorResponse('Failed to unpublish story', 500)
        }

        return createSuccessResponse({ message: 'Story unpublished successfully' })

      } else if (action === 'publish') {
        const { error } = await supabase
          .from('stories')
          .update({
            is_published: true,
            published_at: new Date().toISOString(),
            moderation_reason: null,
            moderated_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', storyId)

        if (error) {
          console.error('Story publish error:', error)
          return createErrorResponse('Failed to publish story', 500)
        }

        return createSuccessResponse({ message: 'Story published successfully' })

      } else if (action === 'feature') {
        const { error } = await supabase
          .from('stories')
          .update({
            is_featured: true,
            featured_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', storyId)

        if (error) {
          console.error('Story feature error:', error)
          return createErrorResponse('Failed to feature story', 500)
        }

        return createSuccessResponse({ message: 'Story featured successfully' })

      } else if (action === 'unfeature') {
        const { error } = await supabase
          .from('stories')
          .update({
            is_featured: false,
            featured_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', storyId)

        if (error) {
          console.error('Story unfeature error:', error)
          return createErrorResponse('Failed to unfeature story', 500)
        }

        return createSuccessResponse({ message: 'Story unfeatured successfully' })

      } else {
        return createErrorResponse('Invalid action', 400)
      }

    } else if (req.method === 'DELETE') {
      // Delete story (admin only)
      if (!storyId || storyId === 'admin-stories') {
        return createErrorResponse('Story ID is required', 400)
      }

      // Delete story and all related data
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId)

      if (error) {
        console.error('Story deletion error:', error)
        return createErrorResponse('Failed to delete story', 500)
      }

      return createSuccessResponse({ message: 'Story deleted successfully' })

    } else {
      return createErrorResponse('Method not allowed', 405)
    }

  } catch (error) {
    console.error('Admin stories error:', error)
    return createErrorResponse(error.message || 'Internal server error', 500)
  }
})
