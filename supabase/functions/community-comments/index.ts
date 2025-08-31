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
    const commentId = url.pathname.split('/').pop()

    if (req.method === 'GET') {
      // Get comments for a post
      const postId = url.searchParams.get('post_id')
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50)

      if (!postId) {
        return createErrorResponse('Post ID is required', 400)
      }

      const { data: comments, error, count } = await supabase
        .from('post_comments')
        .select(`
          id, content, created_at, updated_at,
          author:profiles(id, username, avatar_url),
          likes:comment_likes(id)
        `, { count: 'exact' })
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
        .range((page - 1) * limit, page * limit - 1)

      if (error) {
        console.error('Comments fetch error:', error)
        return createErrorResponse('Failed to fetch comments', 500)
      }

      // Transform comments with counts
      const transformedComments = comments?.map(comment => ({
        ...comment,
        likes_count: comment.likes?.length || 0,
        likes: undefined
      })) || []

      return createSuccessResponse({
        comments: transformedComments,
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      })

    } else if (req.method === 'POST') {
      // Create new comment
      const authResult = await verifyJWT(req)
      if (!authResult.success) {
        return createErrorResponse(authResult.error, 401)
      }

      const userId = authResult.user.sub
      const { content, post_id } = await req.json()

      if (!content || content.length < 3) {
        return createErrorResponse('Comment must be at least 3 characters', 400)
      }

      if (!post_id) {
        return createErrorResponse('Post ID is required', 400)
      }

      // Verify post exists
      const { data: post, error: postError } = await supabase
        .from('community_posts')
        .select('id')
        .eq('id', post_id)
        .single()

      if (postError || !post) {
        return createErrorResponse('Post not found', 404)
      }

      const { data: newComment, error: createError } = await supabase
        .from('post_comments')
        .insert({
          content: sanitizeInput(content),
          post_id: post_id,
          author_id: userId,
          created_at: new Date().toISOString()
        })
        .select(`
          id, content, created_at,
          author:profiles(id, username, avatar_url)
        `)
        .single()

      if (createError) {
        console.error('Comment creation error:', createError)
        return createErrorResponse('Failed to create comment', 500)
      }

      return createSuccessResponse({
        message: 'Comment created successfully',
        comment: newComment
      })

    } else if (req.method === 'PUT') {
      // Update comment
      if (!commentId || commentId === 'community-comments') {
        return createErrorResponse('Comment ID is required', 400)
      }

      const authResult = await verifyJWT(req)
      if (!authResult.success) {
        return createErrorResponse(authResult.error, 401)
      }

      const userId = authResult.user.sub

      // Check if user owns the comment
      const { data: comment, error: commentError } = await supabase
        .from('post_comments')
        .select('id, author_id')
        .eq('id', commentId)
        .single()

      if (commentError || !comment) {
        return createErrorResponse('Comment not found', 404)
      }

      if (comment.author_id !== userId) {
        return createErrorResponse('Unauthorized: You can only update your own comments', 403)
      }

      const { content } = await req.json()

      if (!content || content.length < 3) {
        return createErrorResponse('Comment must be at least 3 characters', 400)
      }

      const { data: updatedComment, error: updateError } = await supabase
        .from('post_comments')
        .update({
          content: sanitizeInput(content),
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .select(`
          id, content, created_at, updated_at,
          author:profiles(id, username, avatar_url)
        `)
        .single()

      if (updateError) {
        console.error('Comment update error:', updateError)
        return createErrorResponse('Failed to update comment', 500)
      }

      return createSuccessResponse({
        message: 'Comment updated successfully',
        comment: updatedComment
      })

    } else if (req.method === 'DELETE') {
      // Delete comment
      if (!commentId || commentId === 'community-comments') {
        return createErrorResponse('Comment ID is required', 400)
      }

      const authResult = await verifyJWT(req)
      if (!authResult.success) {
        return createErrorResponse(authResult.error, 401)
      }

      const userId = authResult.user.sub

      // Check if user owns the comment or is admin
      const { data: comment, error: commentError } = await supabase
        .from('post_comments')
        .select('id, author_id')
        .eq('id', commentId)
        .single()

      if (commentError || !comment) {
        return createErrorResponse('Comment not found', 404)
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      const isAdmin = profile?.role === 'admin'

      if (comment.author_id !== userId && !isAdmin) {
        return createErrorResponse('Unauthorized: You can only delete your own comments', 403)
      }

      const { error: deleteError } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId)

      if (deleteError) {
        console.error('Comment deletion error:', deleteError)
        return createErrorResponse('Failed to delete comment', 500)
      }

      return createSuccessResponse({ message: 'Comment deleted successfully' })

    } else {
      return createErrorResponse('Method not allowed', 405)
    }

  } catch (error) {
    console.error('Community comments error:', error)
    return createErrorResponse(error.message || 'Internal server error', 500)
  }
})
