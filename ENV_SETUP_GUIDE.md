# Environment Setup Guide for Edge Functions Migration

## Required Environment Variables

### Frontend Environment Variables
Create or update your `.env` file in the client directory with:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://wqjymqhfzuejrlcfmxcu.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Edge Functions Configuration
VITE_USE_EDGE_FUNCTIONS=true

# Legacy API (for rollback)
VITE_LEGACY_API_BASE=/api
```

### Supabase Dashboard Environment Variables
Set these in your Supabase Dashboard under Project Settings > Edge Functions:

```env
# Cloudinary Configuration (Required for file uploads)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Supabase Configuration (Auto-provided)
SUPABASE_URL=https://wqjymqhfzuejrlcfmxcu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```

## How to Set Environment Variables

### 1. Frontend Variables (Local Development)
1. Navigate to `client/` directory
2. Create or update `.env` file
3. Add the variables listed above
4. Restart your development server

### 2. Supabase Dashboard Variables
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `wqjymqhfzuejrlcfmxcu`
3. Navigate to **Project Settings** > **Edge Functions**
4. Add each environment variable in the **Environment Variables** section

### 3. Getting Your Keys

#### Supabase Keys:
1. Go to **Project Settings** > **API**
2. Copy your **Project URL** and **anon/public key**
3. Copy your **service_role key** (keep this secret!)

#### Cloudinary Keys:
1. Go to [Cloudinary Dashboard](https://cloudinary.com/console)
2. Copy your **Cloud Name**, **API Key**, and **API Secret**
3. These are required for file upload functionality

## Testing Environment Setup

### Test Edge Functions
```bash
# Test if Edge Functions are accessible
curl -X GET "https://wqjymqhfzuejrlcfmxcu.supabase.co/functions/v1/auth-profile" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test Frontend Configuration
1. Start your development server
2. Open browser console
3. Check if `import.meta.env.VITE_SUPABASE_URL` returns the correct URL
4. Verify API calls are going to Edge Functions URLs

## Rollback Configuration

To rollback to the Express.js backend:
1. Set `VITE_USE_EDGE_FUNCTIONS=false` in your `.env`
2. Ensure your Express.js server is running
3. API calls will automatically route to `/api/*` endpoints

## Security Notes

- **Never commit** `.env` files to version control
- Keep your **service_role key** secret - it has admin privileges
- Use **anon key** for client-side applications
- Cloudinary secrets should only be in Supabase Edge Functions environment

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Ensure Edge Functions include proper CORS headers
2. **Authentication Errors**: Check JWT token format and expiration
3. **Environment Variables Not Loading**: Restart development server after changes
4. **Cloudinary Upload Errors**: Verify all three Cloudinary variables are set correctly

### Debug Commands:
```bash
# Check if environment variables are loaded
echo $VITE_SUPABASE_URL

# Test Edge Function deployment
npx supabase functions list

# Check function logs
npx supabase functions logs --function-name auth-login
```
