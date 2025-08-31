import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface User {
  id: string
  email: string
  role: string
  is_premium: boolean
  is_admin: boolean
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export async function createSupabaseClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
}

export async function verifyJWT(req: Request): Promise<{ success: boolean, user?: any, error?: string }> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return { success: false, error: 'Authorization header required' }
  }

  const token = authHeader.replace('Bearer ', '')
  const supabase = await createSupabaseClient()

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      return { success: false, error: 'Invalid token' }
    }

    return { success: true, user }
  } catch (error) {
    console.error('JWT verification error:', error)
    return { success: false, error: 'Token verification failed' }
  }
}

export async function requireAdminRole(supabase: any, userId: string): Promise<{ success: boolean, error?: string }> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      return { success: false, error: 'User profile not found' }
    }

    if (profile.role !== 'admin') {
      return { success: false, error: 'Admin access required' }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to verify admin role' }
  }
}

export async function verifyAuth(req: Request): Promise<User | null> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return null

  const token = authHeader.replace('Bearer ', '')
  const supabase = await createSupabaseClient()

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return null

    // Get user profile with role information
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_premium, is_admin')
      .eq('id', user.id)
      .single()

    return {
      id: user.id,
      email: user.email!,
      role: profile?.role || 'free',
      is_premium: profile?.is_premium || false,
      is_admin: profile?.is_admin || false,
    }
  } catch (error) {
    console.error('Auth verification error:', error)
    return null
  }
}

export function requireAuth(user: User | null): User {
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

export function requireAdmin(user: User | null): User {
  const authenticatedUser = requireAuth(user)
  if (!authenticatedUser.is_admin && authenticatedUser.role !== 'admin') {
    throw new Error('Admin access required')
  }
  return authenticatedUser
}

export function createErrorResponse(message: string, status: number = 400) {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

export function createSuccessResponse(data: any, status: number = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}
