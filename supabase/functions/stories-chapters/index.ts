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
    const pathParts = url.pathname.split('/')
    const storyId = pathParts[pathParts.length - 2] // /stories/{id}/chapters
    const chapterId = pathParts[pathParts.length - 1] !== 'chapters' ? pathParts[pathParts.length - 1] : null

    if (!storyId) {
      return createErrorResponse('Story ID is required', 400)
    }

    if (req.method === 'GET') {
      // Get chapters for a story
      const { data: chapters, error } = await supabase
        .from('story_chapters')
        .select('id, title, chapter_number, content, file_url, file_type, created_at, updated_at')
        .eq('story_id', storyId)
        .order('chapter_number', { ascending: true })

      if (error) {
        console.error('Chapters fetch error:', error)
        return createErrorResponse('Failed to fetch chapters', 500)
      }

      return createSuccessResponse({ chapters: chapters || [] })

    } else if (req.method === 'POST') {
      // Create new chapter
      const authResult = await verifyJWT(req)
      if (!authResult.success) {
        return createErrorResponse(authResult.error, 401)
      }

      const userId = authResult.user.sub

      // Check if user owns the story
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .select('id, author_id')
        .eq('id', storyId)
        .single()

      if (storyError || !story) {
        return createErrorResponse('Story not found', 404)
      }

      if (story.author_id !== userId) {
        return createErrorResponse('Unauthorized: You can only add chapters to your own stories', 403)
      }

      const { title, content, file_url, file_type, chapter_number } = await req.json()

      if (!title || title.length < 3) {
        return createErrorResponse('Chapter title must be at least 3 characters', 400)
      }

      if (!content && !file_url) {
        return createErrorResponse('Chapter must have either content or file_url', 400)
      }

      // Get next chapter number if not provided
      let nextChapterNumber = chapter_number
      if (!nextChapterNumber) {
        const { data: lastChapter } = await supabase
          .from('story_chapters')
          .select('chapter_number')
          .eq('story_id', storyId)
          .order('chapter_number', { ascending: false })
          .limit(1)
          .single()

        nextChapterNumber = (lastChapter?.chapter_number || 0) + 1
      }

      const { data: newChapter, error: createError } = await supabase
        .from('story_chapters')
        .insert({
          story_id: storyId,
          title: sanitizeInput(title),
          content: content ? sanitizeInput(content) : null,
          file_url: file_url ? sanitizeInput(file_url) : null,
          file_type: file_type || 'text',
          chapter_number: nextChapterNumber,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('Chapter creation error:', createError)
        return createErrorResponse('Failed to create chapter', 500)
      }

      return createSuccessResponse({
        message: 'Chapter created successfully',
        chapter: newChapter
      })

    } else if (req.method === 'PUT') {
      // Update existing chapter
      if (!chapterId) {
        return createErrorResponse('Chapter ID is required for updates', 400)
      }

      const authResult = await verifyJWT(req)
      if (!authResult.success) {
        return createErrorResponse(authResult.error, 401)
      }

      const userId = authResult.user.sub

      // Check if user owns the story
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .select('id, author_id')
        .eq('id', storyId)
        .single()

      if (storyError || !story) {
        return createErrorResponse('Story not found', 404)
      }

      if (story.author_id !== userId) {
        return createErrorResponse('Unauthorized: You can only update chapters in your own stories', 403)
      }

      const { title, content, file_url, file_type } = await req.json()

      const updates: any = {}

      if (title) {
        if (title.length < 3) {
          return createErrorResponse('Chapter title must be at least 3 characters', 400)
        }
        updates.title = sanitizeInput(title)
      }

      if (content !== undefined) {
        updates.content = content ? sanitizeInput(content) : null
      }

      if (file_url !== undefined) {
        updates.file_url = file_url ? sanitizeInput(file_url) : null
      }

      if (file_type) {
        updates.file_type = file_type
      }

      if (Object.keys(updates).length === 0) {
        return createErrorResponse('No valid fields to update', 400)
      }

      updates.updated_at = new Date().toISOString()

      const { data: updatedChapter, error: updateError } = await supabase
        .from('story_chapters')
        .update(updates)
        .eq('id', chapterId)
        .eq('story_id', storyId)
        .select()
        .single()

      if (updateError) {
        console.error('Chapter update error:', updateError)
        return createErrorResponse('Failed to update chapter', 500)
      }

      return createSuccessResponse({
        message: 'Chapter updated successfully',
        chapter: updatedChapter
      })

    } else if (req.method === 'DELETE') {
      // Delete chapter
      if (!chapterId) {
        return createErrorResponse('Chapter ID is required for deletion', 400)
      }

      const authResult = await verifyJWT(req)
      if (!authResult.success) {
        return createErrorResponse(authResult.error, 401)
      }

      const userId = authResult.user.sub

      // Check if user owns the story
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .select('id, author_id')
        .eq('id', storyId)
        .single()

      if (storyError || !story) {
        return createErrorResponse('Story not found', 404)
      }

      if (story.author_id !== userId) {
        return createErrorResponse('Unauthorized: You can only delete chapters from your own stories', 403)
      }

      const { error: deleteError } = await supabase
        .from('story_chapters')
        .delete()
        .eq('id', chapterId)
        .eq('story_id', storyId)

      if (deleteError) {
        console.error('Chapter deletion error:', deleteError)
        return createErrorResponse('Failed to delete chapter', 500)
      }

      return createSuccessResponse({ message: 'Chapter deleted successfully' })

    } else {
      return createErrorResponse('Method not allowed', 405)
    }

  } catch (error) {
    console.error('Chapters error:', error)
    return createErrorResponse(error.message || 'Internal server error', 500)
  }
})
