// API Configuration for Edge Functions Migration
export const API_CONFIG = {
  // Supabase configuration
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://wqjymqhfzuejrlcfmxcu.supabase.co',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  
  // Edge Functions base URL
  EDGE_FUNCTIONS_BASE: `${import.meta.env.VITE_SUPABASE_URL || 'https://wqjymqhfzuejrlcfmxcu.supabase.co'}/functions/v1`,
  
  // Legacy API base (for rollback)
  LEGACY_API_BASE: '/api',
  
  // Feature flag to switch between Edge Functions and legacy API
  USE_EDGE_FUNCTIONS: false, // Temporarily disabled for debugging
}

// Edge Functions endpoint mappings
export const EDGE_FUNCTIONS = {
  // Authentication
  AUTH_REGISTER: 'auth-register',
  AUTH_LOGIN: 'auth-login', 
  AUTH_PROFILE: 'auth-profile',
  
  // Stories
  STORIES_CREATE: 'stories-create',
  STORIES_READ: 'stories-read',
  STORIES_UPDATE: 'stories-update',
  STORIES_PUBLISH: 'stories-publish',
  STORIES_CHAPTERS: 'stories-chapters',
  
  // Admin
  ADMIN_USERS: 'admin-users',
  ADMIN_STORIES: 'admin-stories',
  ADMIN_SUBSCRIPTION_CODES: 'admin-subscription-codes',
  
  // Uploads
  UPLOADS_COVER: 'uploads-cover',
  UPLOADS_PDF: 'uploads-pdf',
  UPLOADS_AUDIO: 'uploads-audio',
  
  // Community
  COMMUNITY_POSTS: 'community-posts',
  COMMUNITY_COMMENTS: 'community-comments',
}

// Helper function to get the correct API URL
export function getApiUrl(endpoint: string): string {
  try {
    if (API_CONFIG.USE_EDGE_FUNCTIONS) {
      return `${API_CONFIG.EDGE_FUNCTIONS_BASE}/${endpoint}`
    }
    return `${API_CONFIG.LEGACY_API_BASE}/${endpoint}`
  } catch (error) {
    console.warn('API config error, falling back to legacy:', error)
    return `${API_CONFIG.LEGACY_API_BASE}/${endpoint}`
  }
}

// Helper function to get Edge Function URL
export function getEdgeFunctionUrl(functionName: string): string {
  return `${API_CONFIG.EDGE_FUNCTIONS_BASE}/${functionName}`
}

// Legacy endpoint mappings for backward compatibility
export const LEGACY_ENDPOINTS = {
  // Admin endpoints
  'admin/stats': EDGE_FUNCTIONS.ADMIN_USERS, // Stats will be handled by admin-users function
  'admin/users': EDGE_FUNCTIONS.ADMIN_USERS,
  'admin/stories': EDGE_FUNCTIONS.ADMIN_STORIES,
  'admin/subscription-codes': EDGE_FUNCTIONS.ADMIN_SUBSCRIPTION_CODES,
  
  // Story endpoints
  'stories/create': EDGE_FUNCTIONS.STORIES_CREATE,
  'stories/read': EDGE_FUNCTIONS.STORIES_READ,
  'stories/update': EDGE_FUNCTIONS.STORIES_UPDATE,
  'stories/publish': EDGE_FUNCTIONS.STORIES_PUBLISH,
  'stories/chapters': EDGE_FUNCTIONS.STORIES_CHAPTERS,
  
  // Upload endpoints
  'upload/cover': EDGE_FUNCTIONS.UPLOADS_COVER,
  'upload/pdf': EDGE_FUNCTIONS.UPLOADS_PDF,
  'upload/audio': EDGE_FUNCTIONS.UPLOADS_AUDIO,
  
  // Auth endpoints
  'auth/register': EDGE_FUNCTIONS.AUTH_REGISTER,
  'auth/login': EDGE_FUNCTIONS.AUTH_LOGIN,
  'auth/profile': EDGE_FUNCTIONS.AUTH_PROFILE,
  
  // Community endpoints
  'community/posts': EDGE_FUNCTIONS.COMMUNITY_POSTS,
  'community/comments': EDGE_FUNCTIONS.COMMUNITY_COMMENTS,
}

// Helper to map legacy endpoint to Edge Function
export function mapLegacyEndpoint(legacyPath: string): string {
  // Remove leading slash and /api prefix
  const cleanPath = legacyPath.replace(/^\/?(api\/)?/, '')
  
  // Check if we have a direct mapping
  if (LEGACY_ENDPOINTS[cleanPath]) {
    return LEGACY_ENDPOINTS[cleanPath]
  }
  
  // Handle dynamic endpoints (e.g., /admin/users/123/ban -> admin-users)
  for (const [pattern, edgeFunction] of Object.entries(LEGACY_ENDPOINTS)) {
    if (cleanPath.startsWith(pattern)) {
      return edgeFunction
    }
  }
  
  // Fallback - return the path as-is for unmapped endpoints
  console.warn(`No Edge Function mapping found for legacy endpoint: ${legacyPath}`)
  return cleanPath
}
