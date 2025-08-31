// @deno-types="https://deno.land/std@0.168.0/http/server.ts"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, verifyAuth, createErrorResponse, createSuccessResponse, createSupabaseClient } from '../../_shared/auth.ts'
import { validateRequest, validateEmail } from '../../_shared/validation.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405)
  }

  try {
    // Validate request body
    const body = await validateRequest(req, ['email', 'code'])
    
    if (!validateEmail(body.email)) {
      return createErrorResponse('Invalid email format')
    }

    const supabase = await createSupabaseClient()

    // Get user by email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', body.email.toLowerCase())
      .single()

    if (profileError || !profile) {
      return createErrorResponse('User not found', 404)
    }

    // Check if user has already redeemed a free code
    const { count: redeemedCount } = await supabase
      .from('subscription_codes')
      .select('id', { head: true, count: 'exact' })
      .eq('used_by', profile.id)
      .eq('is_special_2month', true)

    if (redeemedCount && redeemedCount > 0) {
      return createErrorResponse('You have already redeemed your free code.')
    }

    // Fetch the subscription code
    const { data: codeData, error: codeError } = await supabase
      .from('subscription_codes')
      .select('*')
      .eq('code', body.code.toUpperCase())
      .single()

    if (codeError || !codeData) {
      return createErrorResponse('Code not found', 404)
    }

    if (codeData.is_used) {
      return createErrorResponse('Code already redeemed')
    }

    if (new Date(codeData.expires_at) < new Date()) {
      return createErrorResponse('Code expired')
    }

    // Mark user as premium for the subscription period
    const premiumUntil = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days

    const { error: updateUserError } = await supabase
      .from('profiles')
      .update({ 
        is_premium: true,
        premium_until: premiumUntil.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id)

    if (updateUserError) {
      console.error('User update error:', updateUserError)
      return createErrorResponse('Failed to activate subscription')
    }

    // Mark code as used
    const { error: codeUpdateError } = await supabase
      .from('subscription_codes')
      .update({ 
        is_used: true, 
        used_at: new Date().toISOString(), 
        used_by: profile.id 
      })
      .eq('id', codeData.id)

    if (codeUpdateError) {
      console.error('Code update error:', codeUpdateError)
      // Don't fail the request if code update fails, user is already premium
    }

    return createSuccessResponse({
      message: 'Subscription activated successfully',
      premium_until: premiumUntil.toISOString()
    })

  } catch (error: any) {
    console.error('Subscription redemption error:', error)
    return createErrorResponse(error.message || 'Internal server error', 500)
  }
})
