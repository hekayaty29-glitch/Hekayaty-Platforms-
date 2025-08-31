import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, verifyAuth, requireAuth, createErrorResponse, createSuccessResponse, createSupabaseClient } from '../../_shared/auth.ts'
import { processFileUpload } from '../../_shared/cloudinary.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405)
  }

  try {
    // Verify authentication
    const user = await verifyAuth(req)
    requireAuth(user)

    // Parse multipart form data
    const formData = await req.formData()
    const file = formData.get('avatar') as File

    if (!file) {
      return createErrorResponse('No file provided')
    }

    // Convert file to buffer
    const buffer = new Uint8Array(await file.arrayBuffer())
    
    // Validate and upload file
    const uploadResult = await processFileUpload(buffer, {
      folder: 'avatars',
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      resource_type: 'image'
    })

    // Update user profile with new avatar URL
    const supabase = await createSupabaseClient()
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({ 
        avatar_url: uploadResult.secureUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', user!.id)
      .select()
      .single()

    if (error) {
      console.error('Profile update error:', error)
      return createErrorResponse('Failed to update profile')
    }

    return createSuccessResponse({
      message: 'Avatar uploaded successfully',
      avatar_url: uploadResult.secureUrl,
      profile
    })

  } catch (error) {
    console.error('Avatar upload error:', error)
    return createErrorResponse(error.message || 'Internal server error', 500)
  }
})
