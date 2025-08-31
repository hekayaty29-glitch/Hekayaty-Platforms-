# CORS Configuration Guide for Hekayaty Platform

## 1. Supabase Edge Functions CORS ✅ COMPLETED
Updated `supabase/functions/_shared/utils.ts` with proper CORS headers:
- Access-Control-Allow-Origin: *
- Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
- Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type
- Access-Control-Max-Age: 86400

## 2. Cloudinary CORS Configuration 🔧 REQUIRED

### Steps to configure Cloudinary CORS:

1. **Login to Cloudinary Console**: https://cloudinary.com/console
2. **Go to Settings** → **Security** → **Allowed fetch domains**
3. **Add your domains**:
   ```
   https://hekayaty-platforms-flax.vercel.app
   https://*.vercel.app
   localhost:3000
   localhost:5173
   ```

4. **Upload Settings** → **Upload presets**:
   - Create/edit upload preset
   - Set "Signing Mode" to "Unsigned" for frontend uploads
   - Add allowed origins in "Upload restrictions"

### Alternative: Environment-based CORS
If you need stricter CORS, update `utils.ts`:
```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
    ? 'https://hekayaty-platforms-flax.vercel.app' 
    : '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
}
```

## 3. Google OAuth Console Configuration 🔧 REQUIRED FOR AUTH

### Steps to configure Google OAuth for Supabase Auth:

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Navigate to APIs & Services** → **Credentials**
3. **Find your OAuth 2.0 Client ID** (used for Supabase Auth)
4. **Click Edit** on your OAuth client

### Update Authorized JavaScript Origins:
```
https://hekayaty-platforms-flax.vercel.app
https://wqjymqhfzuejrlcfmxcu.supabase.co
```

### Update Authorized Redirect URIs:
```
https://wqjymqhfzuejrlcfmxcu.supabase.co/auth/v1/callback
https://hekayaty-platforms-flax.vercel.app/auth/callback
```

### For Development (optional):
```
http://localhost:3000
http://localhost:5173
http://localhost:54321/auth/v1/callback
```

5. **Save Changes**

### Verify Supabase Auth Settings:
1. Go to Supabase Dashboard → Authentication → Providers
2. Ensure Google provider is enabled
3. Verify Client ID and Client Secret are set
4. Check Site URL is set to: `https://hekayaty-platforms-flax.vercel.app`

## 4. Verification
After configuring Cloudinary CORS:
1. Test image uploads from your live site
2. Check browser console for CORS errors
3. Test all Edge Functions from production domain

## Common CORS Issues:
- **Preflight requests**: Handled by OPTIONS method in Edge Functions
- **Credentials**: Not needed for current setup
- **Wildcard origins**: Safe for public APIs, restrict for sensitive operations
