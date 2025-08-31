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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const postId = url.pathname.split('/').pop()

    if (req.method === 'GET') {
      // Get posts with pagination
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50)
      const workshopId = url.searchParams.get('workshop_id')

      let query = supabase
        .from('community_posts')
        .select(`
          id, title, content, created_at, updated_at,
          author:profiles(id, username, avatar_url),
          workshop:workshops(id, title),
          likes:post_likes(id),
          comments:post_comments(id)
        `, { count: 'exact' })

      if (workshopId) {
        query = query.eq('workshop_id', workshopId)
      }

      const { data: posts, error, count } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      if (error) {
        console.error('Posts fetch error:', error)
        return createErrorResponse('Failed to fetch posts', 500)
      }

      // Transform posts with counts
      const transformedPosts = posts?.map(post => ({
        ...post,
        likes_count: post.likes?.length || 0,
        comments_count: post.comments?.length || 0,
        likes: undefined,
        comments: undefined
      })) || []

      return createSuccessResponse({
        posts: transformedPosts,
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      })

    } else if (req.method === 'POST') {
      // Create new post
      const authResult = await verifyJWT(req)
      if (!authResult.success) {
        return createErrorResponse(authResult.error, 401)
      }

      const userId = authResult.user.sub
      const { title, content, workshop_id } = await req.json()

      if (!title || title.length < 3) {
        return createErrorResponse('Title must be at least 3 characters', 400)
      }

      if (!content || content.length < 10) {
        return createErrorResponse('Content must be at least 10 characters', 400)
      }

      // Verify workshop exists if provided
      if (workshop_id) {
        const { data: workshop, error: workshopError } = await supabase
          .from('workshops')
          .select('id')
          .eq('id', workshop_id)
          .single()

        if (workshopError || !workshop) {
          return createErrorResponse('Workshop not found', 404)
        }
      }

      const { data: newPost, error: createError } = await supabase
        .from('community_posts')
        .insert({
          title: sanitizeInput(title),
          content: sanitizeInput(content),
          workshop_id: workshop_id || null,
          author_id: userId,
          created_at: new Date().toISOString()
        })
        .select(`
          id, title, content, created_at,
          author:profiles(id, username, avatar_url),
          workshop:workshops(id, title)
        `)
        .single()

      if (createError) {
        console.error('Post creation error:', createError)
        return createErrorResponse('Failed to create post', 500)
      }

      return createSuccessResponse({
        message: 'Post created successfully',
        post: newPost
      })

    } else if (req.method === 'PUT') {
      // Update post
      if (!postId || postId === 'community-posts') {
        return createErrorResponse('Post ID is required', 400)
      }

      const authResult = await verifyJWT(req)
      if (!authResult.success) {
        return createErrorResponse(authResult.error, 401)
      }

      const userId = authResult.user.sub

      // Check if user owns the post
      const { data: post, error: postError } = await supabase
        .from('community_posts')
        .select('id, author_id')
        .eq('id', postId)
        .single()

      if (postError || !post) {
        return createErrorResponse('Post not found', 404)
      }

      if (post.author_id !== userId) {
        return createErrorResponse('Unauthorized: You can only update your own posts', 403)
      }

      const { title, content } = await req.json()

      const updates: any = {}

      if (title) {
        if (title.length < 3) {
          return createErrorResponse('Title must be at least 3 characters', 400)
        }
        updates.title = sanitizeInput(title)
      }

      if (content) {
        if (content.length < 10) {
          return createErrorResponse('Content must be at least 10 characters', 400)
        }
        updates.content = sanitizeInput(content)
      }

      if (Object.keys(updates).length === 0) {
        return createErrorResponse('No valid fields to update', 400)
      }

      updates.updated_at = new Date().toISOString()

      const { data: updatedPost, error: updateError } = await supabase
        .from('community_posts')
        .update(updates)
        .eq('id', postId)
        .select(`
          id, title, content, created_at, updated_at,
          author:profiles(id, username, avatar_url)
        `)
        .single()

      if (updateError) {
        console.error('Post update error:', updateError)
        return createErrorResponse('Failed to update post', 500)
      }

      return createSuccessResponse({
        message: 'Post updated successfully',
        post: updatedPost
      })

    } else if (req.method === 'DELETE') {
      // Delete post
      if (!postId || postId === 'community-posts') {
        return createErrorResponse('Post ID is required', 400)
      }

      const authResult = await verifyJWT(req)
      if (!authResult.success) {
        return createErrorResponse(authResult.error, 401)
      }

      const userId = authResult.user.sub

      // Check if user owns the post or is admin
      const { data: post, error: postError } = await supabase
        .from('community_posts')
        .select('id, author_id')
        .eq('id', postId)
        .single()

      if (postError || !post) {
        return createErrorResponse('Post not found', 404)
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      const isAdmin = profile?.role === 'admin'

      if (post.author_id !== userId && !isAdmin) {
        return createErrorResponse('Unauthorized: You can only delete your own posts', 403)
      }

      const { error: deleteError } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId)

      if (deleteError) {
        console.error('Post deletion error:', deleteError)
        return createErrorResponse('Failed to delete post', 500)
      }

      return createSuccessResponse({ message: 'Post deleted successfully' })

    } else {
      return createErrorResponse('Method not allowed', 405)
    }

  } catch (error) {
    console.error('Community posts error:', error)
    return createErrorResponse(error.message || 'Internal server error', 500)
  }
})
