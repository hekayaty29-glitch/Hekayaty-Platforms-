# Frontend API Update Guide for Edge Functions Migration

## Overview
This guide details the specific changes needed in the frontend code to migrate from Express.js API endpoints to Supabase Edge Functions.

## API Endpoint Mapping

### Base URL Changes

**Before (Express.js):**
```typescript
const API_BASE = '/api'
```

**After (Edge Functions):**
```typescript
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const API_BASE = `${SUPABASE_URL}/functions/v1`
```

### Endpoint Mapping Table

| Express.js Endpoint | Edge Function Endpoint | Status |
|-------------------|----------------------|---------|
| `/api/auth/register` | `/functions/v1/auth/register` | ✅ |
| `/api/auth/login` | `/functions/v1/auth/login` | ✅ |
| `/api/auth/profile` | `/functions/v1/auth/profile` | ✅ |
| `/api/stories/create` | `/functions/v1/stories/create` | ✅ |
| `/api/stories/:id` | `/functions/v1/stories/get` | 🔄 |
| `/api/stories/:id/chapters` | `/functions/v1/stories/chapters` | 🔄 |
| `/api/upload/avatar` | `/functions/v1/uploads/avatar` | ✅ |
| `/api/upload/cover` | `/functions/v1/uploads/cover` | 🔄 |
| `/api/upload/pdf` | `/functions/v1/uploads/pdf` | 🔄 |
| `/api/upload/audio` | `/functions/v1/uploads/audio` | 🔄 |
| `/api/admin/stats` | `/functions/v1/admin/stats` | ✅ |
| `/api/admin/users` | `/functions/v1/admin/users` | 🔄 |
| `/api/admin/stories` | `/functions/v1/admin/stories` | 🔄 |
| `/api/community/workshops` | `/functions/v1/community/workshops` | ✅ |
| `/api/subscriptions/redeem` | `/functions/v1/subscriptions/redeem` | ✅ |

## Code Changes Required

### 1. Update AdminAPIContext.tsx

**Current implementation:**
```typescript
const adminAPI = {
  getStats: async (): Promise<AdminStats> => {
    const token = await getAuthToken();
    const response = await fetch('/api/admin/stats', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },
  // ... other methods
}
```

**Updated implementation:**
```typescript
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

const adminAPI = {
  getStats: async (): Promise<AdminStats> => {
    const token = await getAuthToken();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },
  // ... update all other methods similarly
}
```

### 2. Update queryClient.ts

**Current fetch wrapper:**
```typescript
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token && {
        Authorization: `Bearer ${session.access_token}`,
      }),
      ...options.headers,
    },
  });
  
  // ... rest of the function
};
```

**Updated fetch wrapper:**
```typescript
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  // Convert relative URLs to Edge Functions URLs
  const fullUrl = url.startsWith('/api/') 
    ? url.replace('/api/', `${SUPABASE_URL}/functions/v1/`)
    : url;
  
  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token && {
        Authorization: `Bearer ${session.access_token}`,
      }),
      ...options.headers,
    },
  });
  
  // ... rest of the function
};
```

### 3. Create API Configuration File

Create a new file `client/src/lib/api-config.ts`:

```typescript
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER: `${SUPABASE_URL}/functions/v1/auth/register`,
    LOGIN: `${SUPABASE_URL}/functions/v1/auth/login`,
    PROFILE: `${SUPABASE_URL}/functions/v1/auth/profile`,
  },
  
  // Stories
  STORIES: {
    CREATE: `${SUPABASE_URL}/functions/v1/stories/create`,
    GET: (id: string) => `${SUPABASE_URL}/functions/v1/stories/get?id=${id}`,
    UPDATE: (id: string) => `${SUPABASE_URL}/functions/v1/stories/update?id=${id}`,
    DELETE: (id: string) => `${SUPABASE_URL}/functions/v1/stories/delete?id=${id}`,
    PUBLISH: (id: string) => `${SUPABASE_URL}/functions/v1/stories/publish?id=${id}`,
    CHAPTERS: (id: string) => `${SUPABASE_URL}/functions/v1/stories/chapters?storyId=${id}`,
  },
  
  // Uploads
  UPLOADS: {
    AVATAR: `${SUPABASE_URL}/functions/v1/uploads/avatar`,
    COVER: `${SUPABASE_URL}/functions/v1/uploads/cover`,
    PDF: `${SUPABASE_URL}/functions/v1/uploads/pdf`,
    AUDIO: `${SUPABASE_URL}/functions/v1/uploads/audio`,
  },
  
  // Admin
  ADMIN: {
    STATS: `${SUPABASE_URL}/functions/v1/admin/stats`,
    USERS: `${SUPABASE_URL}/functions/v1/admin/users`,
    STORIES: `${SUPABASE_URL}/functions/v1/admin/stories`,
    SUBSCRIPTION_CODES: `${SUPABASE_URL}/functions/v1/admin/subscription-codes`,
    NEWS: `${SUPABASE_URL}/functions/v1/admin/news`,
    LEGENDARY_CHARACTERS: `${SUPABASE_URL}/functions/v1/admin/legendary-characters`,
    REPORTS: `${SUPABASE_URL}/functions/v1/admin/reports`,
  },
  
  // Community
  COMMUNITY: {
    WORKSHOPS: `${SUPABASE_URL}/functions/v1/community/workshops`,
    POSTS: `${SUPABASE_URL}/functions/v1/community/posts`,
    COMMENTS: `${SUPABASE_URL}/functions/v1/community/comments`,
  },
  
  // Subscriptions
  SUBSCRIPTIONS: {
    FREE: `${SUPABASE_URL}/functions/v1/subscriptions/free`,
    REDEEM: `${SUPABASE_URL}/functions/v1/subscriptions/redeem`,
  },
  
  // Hall of Fame
  HALL_OF_FAME: {
    ACTIVE: `${SUPABASE_URL}/functions/v1/hall-of-fame/active`,
    BEST: `${SUPABASE_URL}/functions/v1/hall-of-fame/best`,
    COMPETITIONS: `${SUPABASE_URL}/functions/v1/hall-of-fame/competitions`,
    HONORABLE: `${SUPABASE_URL}/functions/v1/hall-of-fame/honorable`,
  },
};

export default API_ENDPOINTS;
```

### 4. Update Environment Variables

Add to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Update Specific Components

#### Story Creation Component
```typescript
// Before
const createStory = async (storyData: any) => {
  const response = await fetch('/api/stories/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(storyData)
  });
  return response.json();
};

// After
import { API_ENDPOINTS } from '@/lib/api-config';

const createStory = async (storyData: any) => {
  const response = await fetch(API_ENDPOINTS.STORIES.CREATE, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(storyData)
  });
  return response.json();
};
```

#### File Upload Components
```typescript
// Before
const uploadAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append('avatar', file);
  
  const response = await fetch('/api/upload/avatar', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData
  });
  return response.json();
};

// After
import { API_ENDPOINTS } from '@/lib/api-config';

const uploadAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append('avatar', file);
  
  const response = await fetch(API_ENDPOINTS.UPLOADS.AVATAR, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData
  });
  return response.json();
};
```

## Migration Checklist

### Phase 1: Core Infrastructure
- [ ] Update environment variables
- [ ] Create API configuration file
- [ ] Update base fetch wrapper in queryClient.ts
- [ ] Test authentication flow

### Phase 2: Admin Features
- [ ] Update AdminAPIContext.tsx
- [ ] Update admin dashboard components
- [ ] Test admin functionality
- [ ] Verify user management features

### Phase 3: Story Management
- [ ] Update story creation/editing components
- [ ] Update chapter management
- [ ] Test publishing workflow
- [ ] Verify file uploads

### Phase 4: Community Features
- [ ] Update workshop components
- [ ] Update post/comment functionality
- [ ] Test community interactions
- [ ] Verify like/unlike features

### Phase 5: Subscription System
- [ ] Update VIP code redemption
- [ ] Test subscription flow
- [ ] Verify email integration

### Phase 6: Testing & Validation
- [ ] Run full regression tests
- [ ] Test error handling
- [ ] Verify security measures
- [ ] Performance testing

## Error Handling Updates

Update error handling to work with Edge Functions responses:

```typescript
// Before
const handleApiError = (response: Response) => {
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
};

// After
const handleApiError = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API Error: ${response.status}`);
  }
};
```

## Testing Strategy

### 1. Unit Tests
Update unit tests to use new API endpoints:

```typescript
// Mock Edge Functions URLs in tests
jest.mock('@/lib/api-config', () => ({
  API_ENDPOINTS: {
    STORIES: {
      CREATE: 'http://localhost:54321/functions/v1/stories/create',
    },
  },
}));
```

### 2. Integration Tests
Test complete workflows with Edge Functions:

```typescript
// Test story creation flow
describe('Story Creation', () => {
  it('should create story via Edge Function', async () => {
    // Test implementation
  });
});
```

### 3. E2E Tests
Update Cypress/Playwright tests with new endpoints.

## Rollback Plan

1. **Feature Flag Implementation:**
```typescript
const USE_EDGE_FUNCTIONS = process.env.NEXT_PUBLIC_USE_EDGE_FUNCTIONS === 'true';

const getApiEndpoint = (expressEndpoint: string, edgeEndpoint: string) => {
  return USE_EDGE_FUNCTIONS ? edgeEndpoint : expressEndpoint;
};
```

2. **Gradual Migration:**
Migrate endpoints one by one using feature flags.

3. **Monitoring:**
Monitor error rates and performance metrics during migration.

## Performance Considerations

1. **Bundle Size:**
Edge Functions URLs are longer, consider impact on bundle size.

2. **Caching:**
Update caching strategies for new endpoints.

3. **Error Boundaries:**
Ensure error boundaries handle Edge Functions errors properly.

## Security Updates

1. **CORS Configuration:**
Verify CORS settings work with Edge Functions.

2. **Token Handling:**
Ensure JWT tokens work correctly with Edge Functions.

3. **Input Validation:**
Client-side validation should match Edge Functions validation.

## Post-Migration Tasks

1. **Remove old API references**
2. **Update documentation**
3. **Monitor performance metrics**
4. **Collect user feedback**
5. **Optimize based on usage patterns**
