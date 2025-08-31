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
    const file = formData.get('cover') as File
    const storyId = formData.get('storyId') as string

    if (!file) {
      return createErrorResponse('Cover image file is required', 400)
    }

    if (!storyId) {
      return createErrorResponse('Story ID is required', 400)
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(arrayBuffer)

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
      return createErrorResponse('Unauthorized: You can only upload covers for your own stories', 403)
    }

    // Validate file size (10MB max)
    if (fileBuffer.length > 10 * 1024 * 1024) {
      return createErrorResponse('File size too large. Maximum size is 10MB', 400)
    }

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(fileBuffer, {
      folder: 'story-covers',
      public_id: `story-${storyId}-cover`,
      resource_type: 'image',
      overwrite: true
    })

    if (!uploadResult.success) {
      return createErrorResponse(`Upload failed: ${uploadResult.error}`, 500)
    }

    // Update story with new cover URL
    const { data: updatedStory, error: updateError } = await supabase
      .from('stories')
      .update({
        cover_url: uploadResult.secure_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', storyId)
      .select('id, title, cover_url')
      .single()

    if (updateError) {
      console.error('Story cover update error:', updateError)
      return createErrorResponse('Failed to update story cover', 500)
    }

    return createSuccessResponse({
      message: 'Cover uploaded successfully',
      story: updatedStory,
      cover_url: uploadResult.secure_url
    })

  } catch (error) {
    console.error('Cover upload error:', error)
    return createErrorResponse(error.message || 'Internal server error', 500)
  }
})
