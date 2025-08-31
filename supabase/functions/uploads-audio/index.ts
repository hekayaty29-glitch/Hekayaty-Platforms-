import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, createErrorResponse, createSuccessResponse } from '../_shared/utils.ts'
import { verifyJWT } from '../_shared/auth.ts'
import { uploadToCloudinary } from '../_shared/cloudinary.ts'

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

    // Parse multipart form data
    const formData = await req.formData()
    const file = formData.get('audio') as File
    const storyId = formData.get('storyId') as string
    const chapterTitle = formData.get('chapterTitle') as string

    if (!file) {
      return createErrorResponse('Audio file is required', 400)
    }

    if (!storyId) {
      return createErrorResponse('Story ID is required', 400)
    }

    if (!chapterTitle) {
      return createErrorResponse('Chapter title is required', 400)
    }

    // Validate file type
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a']
    if (!allowedTypes.includes(file.type)) {
      return createErrorResponse('Invalid file type. Only MP3, WAV, OGG, and M4A audio files are allowed', 400)
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return createErrorResponse('File size too large. Maximum size is 50MB', 400)
    }

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
      return createErrorResponse('Unauthorized: You can only upload chapters for your own stories', 403)
    }

    // Get next chapter number
    const { data: lastChapter } = await supabase
      .from('story_chapters')
      .select('chapter_number')
      .eq('story_id', storyId)
      .order('chapter_number', { ascending: false })
      .limit(1)
      .single()

    const nextChapterNumber = (lastChapter?.chapter_number || 0) + 1

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(buffer, {
      folder: 'story-chapters/audio',
      public_id: `story-${storyId}-chapter-${nextChapterNumber}`,
      resource_type: 'video', // Cloudinary uses 'video' for audio files
      overwrite: true
    })

    if (!uploadResult.success) {
      return createErrorResponse(`Upload failed: ${uploadResult.error}`, 500)
    }

    // Create chapter record
    const { data: newChapter, error: chapterError } = await supabase
      .from('story_chapters')
      .insert({
        story_id: storyId,
        title: chapterTitle,
        chapter_number: nextChapterNumber,
        file_url: uploadResult.url,
        file_type: 'audio',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (chapterError) {
      console.error('Chapter creation error:', chapterError)
      return createErrorResponse('Failed to create chapter', 500)
    }

    return createSuccessResponse({
      message: 'Audio chapter uploaded successfully',
      chapter: newChapter
    })

  } catch (error) {
    console.error('Audio upload error:', error)
    return createErrorResponse(error.message || 'Internal server error', 500)
  }
})
