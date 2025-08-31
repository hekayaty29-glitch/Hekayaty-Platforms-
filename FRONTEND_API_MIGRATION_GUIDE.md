# Frontend API Migration Guide - Edge Functions

## Overview
This guide provides step-by-step instructions to update your frontend API calls from Express.js endpoints to Supabase Edge Functions.

## URL Pattern Changes

### Old Express.js Pattern:
```
/api/{endpoint}
```

### New Edge Functions Pattern:
```
https://{project-ref}.supabase.co/functions/v1/{function-name}
```

## Required Environment Variables

Add these to your frontend environment:
```env
VITE_SUPABASE_URL=https://wqjymqhfzuejrlcfmxcu.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## API Endpoint Mappings

### Authentication APIs
| Old Endpoint | New Edge Function | Method |
|--------------|-------------------|--------|
| `/api/auth/register` | `auth-register` | POST |
| `/api/auth/login` | `auth-login` | POST |
| `/api/auth/profile` | `auth-profile` | GET/PUT/DELETE |

### Story Management APIs
| Old Endpoint | New Edge Function | Method |
|--------------|-------------------|--------|
| `/api/stories/create` | `stories-create` | POST |
| `/api/stories/:id` | `stories-read` | GET |
| `/api/stories/:id/update` | `stories-update` | PUT |
| `/api/stories/:id/publish` | `stories-publish` | POST |
| `/api/stories/:id/chapters` | `stories-chapters` | GET/POST/PUT/DELETE |

### Upload APIs
| Old Endpoint | New Edge Function | Method |
|--------------|-------------------|--------|
| `/api/upload/cover` | `uploads-cover` | POST |
| `/api/upload/pdf` | `uploads-pdf` | POST |
| `/api/upload/audio` | `uploads-audio` | POST |

### Admin APIs
| Old Endpoint | New Edge Function | Method |
|--------------|-------------------|--------|
| `/api/admin/users` | `admin-users` | GET/PUT/DELETE |
| `/api/admin/stories` | `admin-stories` | GET/PUT/DELETE |
| `/api/admin/subscription-codes` | `admin-subscription-codes` | GET/POST/PUT |

### Community APIs
| Old Endpoint | New Edge Function | Method |
|--------------|-------------------|--------|
| `/api/community/posts` | `community-posts` | GET/POST/PUT/DELETE |
| `/api/community/comments` | `community-comments` | GET/POST/PUT/DELETE |

## Code Update Examples

### 1. Update API Base URL

**Before:**
```typescript
const API_BASE = '/api'
```

**After:**
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const API_BASE = `${SUPABASE_URL}/functions/v1`
```

### 2. Update Authentication Calls

**Before:**
```typescript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
})
```

**After:**
```typescript
const response = await fetch(`${API_BASE}/auth-login`, {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ email, password })
})
```

### 3. Update Story Management

**Before:**
```typescript
const response = await fetch(`/api/stories/${storyId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

**After:**
```typescript
const response = await fetch(`${API_BASE}/stories-read`, {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ storyId })
})
```

### 4. Update File Uploads

**Before:**
```typescript
const formData = new FormData()
formData.append('cover', file)
formData.append('storyId', storyId)

const response = await fetch('/api/upload/cover', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
})
```

**After:**
```typescript
const formData = new FormData()
formData.append('cover', file)
formData.append('storyId', storyId)

const response = await fetch(`${API_BASE}/uploads-cover`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
})
```

## Files to Update

### Core API Files
1. `client/src/lib/api.ts` - Main API configuration
2. `client/src/context/AuthContext.tsx` - Authentication context
3. `client/src/context/AdminAPIContext.tsx` - Admin API context
4. `client/src/hooks/useStories.ts` - Story management hooks
5. `client/src/components/upload/` - Upload components

### Specific Components
1. **Authentication Components:**
   - `LoginForm.tsx`
   - `RegisterForm.tsx`
   - `ProfileSettings.tsx`

2. **Story Components:**
   - `StoryCreator.tsx`
   - `StoryEditor.tsx`
   - `ChapterUpload.tsx`

3. **Admin Components:**
   - `AdminDashboard.tsx`
   - `UserManagement.tsx`
   - `StoryModeration.tsx`

4. **Upload Components:**
   - `CoverUpload.tsx`
   - `PDFUpload.tsx`
   - `AudioUpload.tsx`

## Testing Checklist

- [ ] User registration and login
- [ ] Story creation and editing
- [ ] Chapter uploads (PDF, audio)
- [ ] Cover image uploads
- [ ] Admin dashboard functionality
- [ ] Community posts and comments
- [ ] File upload validation
- [ ] Error handling and user feedback

## Environment Setup

### Supabase Dashboard Configuration
1. Go to Project Settings > API
2. Copy your project URL and anon key
3. Set environment variables in Supabase Dashboard:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

### Local Development
Update your `.env` file:
```env
VITE_SUPABASE_URL=https://wqjymqhfzuejrlcfmxcu.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Migration Strategy

1. **Phase 1:** Update API configuration and base URLs
2. **Phase 2:** Update authentication flows
3. **Phase 3:** Update story management APIs
4. **Phase 4:** Update file upload functionality
5. **Phase 5:** Update admin and community features
6. **Phase 6:** Test and validate all functionality

## Rollback Plan

Keep the old Express.js backend running until full migration is tested and validated. You can switch between backends by updating the API base URL configuration.
