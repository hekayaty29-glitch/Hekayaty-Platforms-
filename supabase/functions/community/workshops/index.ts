// @deno-types="https://deno.land/std@0.168.0/http/server.ts"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, verifyAuth, requireAuth, createErrorResponse, createSuccessResponse, createSupabaseClient } from '../../_shared/auth.ts'
import { validateRequest } from '../../_shared/validation.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = await createSupabaseClient()

  try {
    if (req.method === 'GET') {
      // Get all workshops
      const { data: workshops, error } = await supabase
        .from('workshops')
        .select(`
          *,
          owner:profiles!workshops_owner_id_fkey(id, username, full_name, avatar_url)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Workshops fetch error:', error)
        return createErrorResponse('Failed to fetch workshops')
      }

      return createSuccessResponse(workshops)
    }

    if (req.method === 'POST') {
      // Create new workshop
      const user = await verifyAuth(req)
      requireAuth(user)

      const body = await validateRequest(req, ['title', 'description'])

      const { data: workshop, error } = await supabase
        .from('workshops')
        .insert({
          title: body.title,
          description: body.description,
          owner_id: user!.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select(`
          *,
          owner:profiles!workshops_owner_id_fkey(id, username, full_name, avatar_url)
        `)
        .single()

      if (error) {
        console.error('Workshop creation error:', error)
        return createErrorResponse('Failed to create workshop')
      }

      return createSuccessResponse(workshop, 201)
    }

    return createErrorResponse('Method not allowed', 405)

  } catch (error: any) {
    console.error('Workshop operation error:', error)
    return createErrorResponse(error.message || 'Internal server error', 500)
  }
})
