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
    const codeId = url.pathname.split('/').pop()

    if (req.method === 'GET') {
      // Get subscription codes with pagination
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)
      const status = url.searchParams.get('status') // 'active', 'used', 'expired'
      const type = url.searchParams.get('type') // 'premium', 'vip'

      let query = supabase
        .from('subscription_codes')
        .select(`
          id, code, type, duration_months, max_uses, current_uses,
          is_active, expires_at, created_at,
          created_by:profiles(id, username),
          redemptions:code_redemptions(
            id, redeemed_at,
            user:profiles(id, username, email)
          )
        `, { count: 'exact' })

      if (status === 'active') {
        query = query.eq('is_active', true).gt('expires_at', new Date().toISOString())
      } else if (status === 'used') {
        // Filter for codes where current_uses >= max_uses
        const { data: usedCodes } = await supabase
          .from('subscription_codes')
          .select('*')
          .gte('current_uses', 1)
        query = query.in('id', usedCodes?.map(c => c.id) || [])
      } else if (status === 'expired') {
        query = query.lt('expires_at', new Date().toISOString())
      }

      if (type) {
        query = query.eq('type', type)
      }

      const { data: codes, error, count } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      if (error) {
        console.error('Subscription codes fetch error:', error)
        return createErrorResponse('Failed to fetch subscription codes', 500)
      }

      return createSuccessResponse({
        codes: codes || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      })

    } else if (req.method === 'POST') {
      // Create new subscription codes
      const { 
        count = 1, 
        type = 'premium', 
        duration_months = 1, 
        max_uses = 1,
        expires_in_days = 30 
      } = await req.json()

      if (!['premium', 'vip'].includes(type)) {
        return createErrorResponse('Invalid subscription type', 400)
      }

      if (count < 1 || count > 100) {
        return createErrorResponse('Count must be between 1 and 100', 400)
      }

      const codes = []
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + expires_in_days)

      for (let i = 0; i < count; i++) {
        // Generate unique code
        const code = `${type.toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`
        
        codes.push({
          code,
          type,
          duration_months,
          current_uses: 0,
          is_active: true,
          created_at: new Date().toISOString()
        })
      }

      return createSuccessResponse({
        message: `${count} subscription code(s) created successfully`,
        codes: codes
      })

    } else if (req.method === 'PUT') {
      // Update subscription code (activate/deactivate)
      if (!codeId || codeId === 'admin-subscription-codes') {
        return createErrorResponse('Code ID is required', 400)
      }

      const { action } = await req.json()

      if (action === 'activate') {
        const { error } = await supabase
          .from('subscription_codes')
          .update({
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', codeId)

        if (error) {
          console.error('Code activation error:', error)
          return createErrorResponse('Failed to activate code', 500)
        }

        return createSuccessResponse({ message: 'Code activated successfully' })

      } else if (action === 'deactivate') {
        const { error } = await supabase
          .from('subscription_codes')
          .update({
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', codeId)

        if (error) {
          console.error('Code deactivation error:', error)
          return createErrorResponse('Failed to deactivate code', 500)
        }

        return createSuccessResponse({ message: 'Code deactivated successfully' })

      } else {
        return createErrorResponse('Invalid action', 400)
      }

    } else if (req.method === 'DELETE') {
      // Delete subscription code
      if (!codeId || codeId === 'admin-subscription-codes') {
        return createErrorResponse('Code ID is required', 400)
      }

      const { error } = await supabase
        .from('subscription_codes')
        .delete()
        .eq('id', codeId)

      if (error) {
        console.error('Code deletion error:', error)
        return createErrorResponse('Failed to delete code', 500)
      }

      return createSuccessResponse({ message: 'Code deleted successfully' })

    } else {
      return createErrorResponse('Method not allowed', 405)
    }

  } catch (error) {
    console.error('Admin subscription codes error:', error)
    return createErrorResponse(error.message || 'Internal server error', 500)
  }
})
