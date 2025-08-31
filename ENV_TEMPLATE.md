# Environment Variables Setup

Create a `.env` file in the root directory with these variables:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database
DATABASE_URL=your_database_connection_string

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Optional
CORS_ORIGIN=http://localhost:5173,http://localhost:5000
```

## How to get these values:

### Supabase:
1. Go to your Supabase dashboard
2. Select your project
3. Go to Settings > API
4. Copy the Project URL and API keys

### Resend:
1. Go to resend.com
2. Create an account
3. Generate an API key

### Cloudinary:
1. Go to cloudinary.com
2. Create an account
3. Get your cloud name, API key, and API secret from the dashboard

After creating the `.env` file, restart the server with `npm run dev`.
