// Upload utilities for Edge Functions migration
import { getEdgeFunctionUrl, EDGE_FUNCTIONS } from './api-config';

export interface UploadOptions {
  folder?: string;
  storyId?: string;
  chapterTitle?: string;
}

// Helper to get auth token
async function getAuthToken(): Promise<string | null> {
  const { supabase } = await import('./supabase');
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

// Generic file upload function
export async function uploadFile(
  file: File, 
  uploadType: 'cover' | 'pdf' | 'audio' | 'general',
  options: UploadOptions = {}
): Promise<{ url: string; success: boolean; error?: string }> {
  try {
    const token = await getAuthToken();
    const formData = new FormData();
    
    // Add file and options to form data
    formData.append('file', file);
    if (options.folder) formData.append('folder', options.folder);
    if (options.storyId) formData.append('storyId', options.storyId);
    if (options.chapterTitle) formData.append('chapterTitle', options.chapterTitle);

    // Determine the correct Edge Function endpoint
    let endpoint: string;
    switch (uploadType) {
      case 'cover':
        endpoint = getEdgeFunctionUrl(EDGE_FUNCTIONS.UPLOADS_COVER);
        if (options.storyId) formData.append('storyId', options.storyId);
        break;
      case 'pdf':
        endpoint = getEdgeFunctionUrl(EDGE_FUNCTIONS.UPLOADS_PDF);
        if (options.storyId) formData.append('storyId', options.storyId);
        if (options.chapterTitle) formData.append('chapterTitle', options.chapterTitle);
        break;
      case 'audio':
        endpoint = getEdgeFunctionUrl(EDGE_FUNCTIONS.UPLOADS_AUDIO);
        if (options.storyId) formData.append('storyId', options.storyId);
        if (options.chapterTitle) formData.append('chapterTitle', options.chapterTitle);
        break;
      case 'general':
      default:
        // For general uploads, use Cloudinary directly or create a general upload function
        return await uploadToCloudinaryDirect(file, options.folder || 'general');
    }

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorData.error || `Upload failed with status ${response.status}`);
    }

    const result = await response.json();
    return {
      url: result.url || result.cover_url || result.chapter_url,
      success: true
    };

  } catch (error) {
    console.error('Upload error:', error);
    return {
      url: '',
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

// Direct Cloudinary upload for general files (fallback)
async function uploadToCloudinaryDirect(file: File, folder: string = 'general'): Promise<{ url: string; success: boolean; error?: string }> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'unsigned_preset');
    formData.append('folder', folder);

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
      throw new Error('Cloudinary configuration missing');
    }

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Cloudinary upload failed');
    }

    const result = await response.json();
    return {
      url: result.secure_url || result.url,
      success: true
    };

  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      url: '',
      success: false,
      error: error instanceof Error ? error.message : 'Cloudinary upload failed'
    };
  }
}

// Specific upload functions for different types
export const uploadCover = (file: File, storyId: string) => 
  uploadFile(file, 'cover', { storyId });

export const uploadPDF = (file: File, storyId: string, chapterTitle: string) => 
  uploadFile(file, 'pdf', { storyId, chapterTitle });

export const uploadAudio = (file: File, storyId: string, chapterTitle: string) => 
  uploadFile(file, 'audio', { storyId, chapterTitle });

export const uploadGeneral = (file: File, folder?: string) => 
  uploadFile(file, 'general', { folder });

// Legacy API compatibility function
export async function legacyUploadFile(file: File, folder: string): Promise<{ url: string; success: boolean; error?: string }> {
  console.warn('Using legacy upload - consider migrating to specific upload functions');
  return uploadGeneral(file, folder);
}
