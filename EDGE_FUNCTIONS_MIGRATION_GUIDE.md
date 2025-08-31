# Supabase Edge Functions Migration Guide

## Overview
This guide provides step-by-step instructions for migrating the Hekayaty Platform from Express.js backend to Supabase Edge Functions.

## Prerequisites
- Supabase CLI installed
- Deno runtime (for local development)
- Access to Cloudinary and Resend accounts
- Supabase project with service role key

## Migration Steps

### Step 1: Environment Setup

1. **Install Supabase CLI:**
```bash
npm install -g supabase
```

2. **Initialize Supabase in your project:**
```bash
supabase init
```

3. **Set up environment variables in Supabase:**
```bash
supabase secrets set CLOUDINARY_CLOUD_NAME=your_cloud_name
supabase secrets set CLOUDINARY_API_KEY=your_api_key
supabase secrets set CLOUDINARY_API_SECRET=your_api_secret
supabase secrets set RESEND_API_KEY=your_resend_key
```

### Step 2: Deploy Shared Utilities

Deploy the shared utilities first as they're dependencies for other functions:

```bash
supabase functions deploy _shared --no-verify-jwt
```

### Step 3: Deploy Core Functions

Deploy functions in this order to handle dependencies:

1. **Authentication functions:**
```bash
supabase functions deploy auth
```

2. **Story management:**
```bash
supabase functions deploy stories
```

3. **File uploads:**
```bash
supabase functions deploy uploads
```

4. **Admin functions:**
```bash
supabase functions deploy admin
```

5. **Community features:**
```bash
supabase functions deploy community
```

6. **Subscription system:**
```bash
supabase functions deploy subscriptions
```

### Step 4: Test Edge Functions

Test each function locally before production deployment:

```bash
supabase functions serve
```

Test endpoints using curl or Postman:
```bash
curl -X POST 'http://localhost:54321/functions/v1/stories/create' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"title":"Test Story","description":"Test description","genre":"fantasy"}'
```

### Step 5: Update Frontend API Calls

Update all API endpoints in your frontend code:

**Before (Express.js):**
```typescript
const response = await fetch('/api/stories/create', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data)
})
```

**After (Edge Functions):**
```typescript
const response = await fetch(`${SUPABASE_URL}/functions/v1/stories/create`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data)
})
```

### Step 6: Database Considerations

1. **Row Level Security (RLS):**
Ensure RLS policies are properly configured for all tables.

2. **Indexes:**
Review and optimize database indexes for Edge Functions queries.

3. **Triggers:**
Set up database triggers for automatic timestamp updates.

## Security Best Practices

### 1. JWT Token Verification
All Edge Functions should verify JWT tokens using the shared auth utility:

```typescript
const user = await verifyAuth(req)
requireAuth(user)
```

### 2. Input Validation
Always validate and sanitize input data:

```typescript
const body = await validateRequest(req, ['title', 'description'])
```

### 3. Rate Limiting
Implement rate limiting for sensitive endpoints:

```typescript
// Use Supabase's built-in rate limiting or implement custom logic
```

### 4. Error Handling
Provide consistent error responses:

```typescript
return createErrorResponse('Error message', 400)
```

## Performance Optimization

### 1. Database Queries
- Use selective queries with specific columns
- Implement proper indexing
- Use database functions for complex operations

### 2. Caching
- Leverage Supabase's built-in caching
- Implement client-side caching with React Query

### 3. File Uploads
- Stream large files directly to Cloudinary
- Implement file type and size validation
- Use progressive upload for better UX

## Monitoring and Debugging

### 1. Logging
Use structured logging in Edge Functions:

```typescript
console.log('Function executed', { userId, action, timestamp })
```

### 2. Error Tracking
Implement error tracking and monitoring:

```typescript
console.error('Function error:', error)
```

### 3. Performance Metrics
Monitor function execution time and memory usage through Supabase dashboard.

## Rollback Strategy

1. **Keep Express.js backend running** during initial Edge Functions deployment
2. **Use feature flags** to gradually migrate endpoints
3. **Monitor error rates** and performance metrics
4. **Have rollback plan** ready in case of issues

## Common Issues and Solutions

### 1. CORS Issues
Ensure proper CORS headers in all functions:

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

### 2. File Upload Size Limits
Edge Functions have size limits. For large files, consider:
- Direct uploads to Cloudinary from frontend
- Chunked upload implementation
- Streaming uploads

### 3. Cold Start Performance
- Keep functions warm with periodic health checks
- Optimize function initialization code
- Use connection pooling for database connections

## Testing Strategy

### 1. Unit Tests
Test individual function logic:

```typescript
// Test validation functions
// Test business logic
// Test error handling
```

### 2. Integration Tests
Test complete API workflows:

```typescript
// Test authentication flow
// Test file upload process
// Test admin operations
```

### 3. Load Testing
Test function performance under load:

```bash
# Use tools like Artillery or k6 for load testing
```

## Deployment Checklist

- [ ] All environment variables configured
- [ ] Shared utilities deployed
- [ ] Core functions deployed and tested
- [ ] Frontend updated with new endpoints
- [ ] Database RLS policies configured
- [ ] Monitoring and logging set up
- [ ] Rollback plan documented
- [ ] Performance benchmarks established
- [ ] Security audit completed

## Post-Migration Tasks

1. **Monitor performance metrics** for the first week
2. **Collect user feedback** on any issues
3. **Optimize slow queries** based on monitoring data
4. **Update documentation** with new architecture
5. **Train team** on Edge Functions development
6. **Decommission Express.js backend** after successful migration

## Support and Resources

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Deno Documentation](https://deno.land/manual)
- [Cloudinary API Documentation](https://cloudinary.com/documentation)
- [Project-specific documentation in this repository]
