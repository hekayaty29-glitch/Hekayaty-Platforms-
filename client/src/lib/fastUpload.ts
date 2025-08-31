import { supabase } from './supabase';

interface UploadOptions {
  file: File;
  endpoint: string;
  folder?: string;
  onProgress?: (progress: number) => void;
  compress?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

interface UploadResult {
  url: string;
  public_id: string;
  width?: number;
  height?: number;
  bytes?: number;
}

// Image compression utility
const compressImage = (file: File, maxWidth = 1200, maxHeight = 800, quality = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        quality
      );
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Fast upload with chunking and progress
export const fastUpload = async (options: UploadOptions): Promise<UploadResult> => {
  const { file, endpoint, folder, onProgress, compress = true, maxWidth = 1200, maxHeight = 800, quality = 0.8 } = options;
  
  let uploadFile = file;
  
  // Compress images for faster upload
  if (compress && file.type.startsWith('image/')) {
    onProgress?.(5); // 5% for compression start
    uploadFile = await compressImage(file, maxWidth, maxHeight, quality);
    onProgress?.(15); // 15% after compression
  }
  
  // Get auth token
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  
  const formData = new FormData();
  formData.append('file', uploadFile);
  if (folder) {
    formData.append('folder', folder);
  }
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    // Progress tracking
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const progress = Math.round((e.loaded / e.total) * 85) + 15; // 15-100%
        onProgress?.(progress);
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const result = JSON.parse(xhr.responseText);
          onProgress?.(100);
          resolve(result);
        } catch (error) {
          reject(new Error('Invalid response format'));
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    });
    
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });
    
    xhr.open('POST', endpoint);
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    
    xhr.send(formData);
  });
};

// Batch upload with parallel processing
export const batchUpload = async (
  files: File[],
  endpoint: string,
  options: {
    folder?: string;
    onProgress?: (fileIndex: number, progress: number) => void;
    onComplete?: (fileIndex: number, result: UploadResult) => void;
    maxConcurrent?: number;
  } = {}
): Promise<UploadResult[]> => {
  const { folder, onProgress, onComplete, maxConcurrent = 3 } = options;
  const results: UploadResult[] = [];
  
  // Process files in batches
  for (let i = 0; i < files.length; i += maxConcurrent) {
    const batch = files.slice(i, i + maxConcurrent);
    
    const batchPromises = batch.map(async (file, batchIndex) => {
      const fileIndex = i + batchIndex;
      
      try {
        const result = await fastUpload({
          file,
          endpoint,
          folder,
          onProgress: (progress) => onProgress?.(fileIndex, progress),
        });
        
        onComplete?.(fileIndex, result);
        return result;
      } catch (error) {
        console.error(`Upload failed for file ${fileIndex}:`, error);
        throw error;
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  return results;
};

// Specialized upload functions
export const uploadAvatar = (file: File, onProgress?: (progress: number) => void) => {
  return fastUpload({
    file,
    endpoint: '/api/upload/avatar',
    onProgress,
    compress: true,
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.9,
  });
};

export const uploadStoryCover = (file: File, storyId?: string, onProgress?: (progress: number) => void) => {
  const formData = new FormData();
  formData.append('cover', file);
  if (storyId) formData.append('storyId', storyId);
  
  return fastUpload({
    file,
    endpoint: '/api/upload/story-cover',
    onProgress,
    compress: true,
    maxWidth: 800,
    maxHeight: 1200,
    quality: 0.85,
  });
};

export const uploadComicImage = (file: File, onProgress?: (progress: number) => void) => {
  return fastUpload({
    file,
    endpoint: '/api/upload/file',
    folder: 'comic-elements',
    onProgress,
    compress: true,
    maxWidth: 1200,
    maxHeight: 800,
    quality: 0.8,
  });
};

export const uploadStoryImages = async (
  files: File[],
  storyId?: string,
  onProgress?: (fileIndex: number, progress: number) => void
) => {
  // Use the specialized story-images endpoint for better performance
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  
  const formData = new FormData();
  files.forEach((file, index) => {
    formData.append('images', file);
  });
  if (storyId) formData.append('storyId', storyId);
  
  return new Promise<UploadResult[]>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const progress = Math.round((e.loaded / e.total) * 100);
        // Report same progress for all files since they're uploaded together
        files.forEach((_, index) => onProgress?.(index, progress));
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const result = JSON.parse(xhr.responseText);
          resolve(result.images || []);
        } catch (error) {
          reject(new Error('Invalid response format'));
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    });
    
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });
    
    xhr.open('POST', '/api/upload/story-images');
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    
    xhr.send(formData);
  });
};
