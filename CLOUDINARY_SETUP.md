# 📁 Cloudinary Integration Setup for NovelNexus

## ✅ **What's Now Complete:**

Your NovelNexus application now has **full Cloudinary integration** for handling:
- 📸 **User avatars**
- 🖼️ **Story cover images**
- 🎨 **Story poster images** 
- 📄 **PDF story files**
- 🖼️ **Multiple story images**
- 📎 **General file uploads**

## 🔧 **Required Environment Variables:**

Add these to your `.env` file in the root directory:

### **Backend (.env)**
```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Existing Supabase variables
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### **Frontend (.env.local)**
```env
# Cloudinary Configuration (for direct uploads if needed)
VITE_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-upload-preset-name
```

## 🚀 **How to Get Cloudinary Credentials:**

1. **Sign up at [Cloudinary](https://cloudinary.com/)**
2. **Go to Dashboard** → You'll see your credentials
3. **Copy the following:**
   - **Cloud Name** → `CLOUDINARY_CLOUD_NAME`
   - **API Key** → `CLOUDINARY_API_KEY`
   - **API Secret** → `CLOUDINARY_API_SECRET`

4. **Create Upload Preset** (for frontend uploads):
   - Go to **Settings** → **Upload**
   - Click **Add upload preset**
   - Set **Signing Mode** to "Unsigned"
   - Name it (e.g., "novelnexus_uploads")
   - Copy the name → `VITE_CLOUDINARY_UPLOAD_PRESET`

## 📡 **Available Upload Endpoints:**

### **Backend API Routes:**
- `POST /api/upload/avatar` - Upload user avatar
- `POST /api/upload/story-cover` - Upload story cover image
- `POST /api/upload/story-poster` - Upload story poster image
- `POST /api/upload/story-pdf` - Upload PDF story files
- `POST /api/upload/story-images` - Upload multiple story images
- `POST /api/upload/file` - Upload general files
- `DELETE /api/upload/:publicId` - Delete files from Cloudinary
- `POST /api/upload/signature` - Get upload signature for direct uploads

### **File Type Support:**
- **Images:** JPEG, PNG, GIF, WebP (max 10MB)
- **PDFs:** PDF files (max 50MB)
- **Documents:** Word docs (max 25MB)

## 💻 **Frontend Usage Examples:**

### **Using the Upload Hook:**
```typescript
import { useAvatarUpload } from '@/hooks/useFileUpload';

const MyComponent = () => {
  const { upload, isUploading, uploadProgress } = useAvatarUpload({
    onSuccess: (data) => {
      console.log('Avatar uploaded:', data.url);
    }
  });

  const handleFileSelect = (file: File) => {
    upload(file);
  };

  return (
    <div>
      {isUploading && <div>Uploading... {uploadProgress}%</div>}
      <input type="file" onChange={(e) => handleFileSelect(e.target.files[0])} />
    </div>
  );
};
```

### **Direct API Usage:**
```typescript
import { uploadStoryCover } from '@/lib/upload';

const uploadCover = async (file: File, storyId: string) => {
  try {
    const result = await uploadStoryCover(file, storyId);
    console.log('Cover uploaded:', result.url);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

## 🗂️ **Cloudinary Folder Structure:**

Files are automatically organized in Cloudinary:
```
novelnexus/
├── avatars/          # User profile pictures
├── story-covers/     # Story cover images
├── story-posters/    # Story poster images
├── story-pdfs/       # PDF story files
├── story-images/     # Additional story images
└── general/          # Other uploaded files
```

## 🔒 **Security Features:**

- ✅ **Authentication required** for all uploads
- ✅ **File type validation** (images, PDFs, documents only)
- ✅ **File size limits** (10MB images, 50MB PDFs)
- ✅ **Automatic file organization** in folders
- ✅ **Secure deletion** with proper authorization

## 🎯 **Next Steps:**

1. **Get Cloudinary credentials** from your dashboard
2. **Add environment variables** to your `.env` files
3. **Test file uploads** using the provided hooks/utilities
4. **Update your story creation/editing forms** to use the new upload system

Your NovelNexus application now has **enterprise-grade file handling** with Cloudinary! 🚀
