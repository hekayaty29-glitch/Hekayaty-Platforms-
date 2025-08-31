import { apiRequest } from './queryClient';

export interface UploadResponse {
  message: string;
  url: string;
  public_id: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  pages?: number;
}

export interface MultipleUploadResponse {
  message: string;
  images: Array<{
    url: string;
    public_id: string;
    width: number;
    height: number;
  }>;
}

// Upload user avatar
export const uploadAvatar = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await apiRequest('POST', '/api/upload/avatar', formData);
  return await response.json();
};

// Upload story cover image
export const uploadStoryCover = async (file: File, storyId?: string): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('cover', file);
  if (storyId) {
    formData.append('storyId', storyId);
  }

  const response = await apiRequest('POST', '/api/upload/story-cover', formData);
  return await response.json();
};

// Upload story poster image
export const uploadStoryPoster = async (file: File, storyId?: string): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('poster', file);
  if (storyId) {
    formData.append('storyId', storyId);
  }

  const response = await apiRequest('POST', '/api/upload/story-poster', formData);
  return await response.json();
};

// Upload PDF story
export const uploadStoryPDF = async (file: File, storyId?: string): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('pdf', file);
  if (storyId) {
    formData.append('storyId', storyId);
  }

  const response = await apiRequest('POST', '/api/upload/story-pdf', formData);
  return await response.json();
};

// Upload multiple story images
export const uploadStoryImages = async (files: File[], storyId?: string): Promise<MultipleUploadResponse> => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('images', file);
  });
  if (storyId) {
    formData.append('storyId', storyId);
  }

  const response = await apiRequest('POST', '/api/upload/story-images', formData);
  return await response.json();
};

// Upload general file
export const uploadFile = async (file: File, folder?: string): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  if (folder) {
    formData.append('folder', folder);
  }

  const response = await apiRequest('POST', '/api/upload/file', formData);
  return await response.json();
};

// Delete file from Cloudinary
export const deleteFile = async (publicId: string, resourceType: 'image' | 'raw' | 'video' = 'image'): Promise<void> => {
  await apiRequest('DELETE', `/api/upload/${encodeURIComponent(publicId)}?type=${resourceType}`);
};

// Get upload signature for direct frontend uploads
export const getUploadSignature = async (folder?: string, publicId?: string) => {
  const response = await apiRequest('POST', '/api/upload/signature', { folder, public_id: publicId });
  return await response.json();
};

// Utility function to validate file types
export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

// Utility function to validate file size
export const validateFileSize = (file: File, maxSizeMB: number): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

// Image file types
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Document file types
export const DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

// All allowed file types
export const ALL_ALLOWED_TYPES = [...IMAGE_TYPES, ...DOCUMENT_TYPES];

// File size limits (in MB)
export const FILE_SIZE_LIMITS = {
  IMAGE: 10,
  PDF: 50,
  DOCUMENT: 25,
};

// Utility to get file type category
export const getFileTypeCategory = (file: File): 'image' | 'pdf' | 'document' | 'unknown' => {
  if (IMAGE_TYPES.includes(file.type)) return 'image';
  if (file.type === 'application/pdf') return 'pdf';
  if (DOCUMENT_TYPES.includes(file.type)) return 'document';
  return 'unknown';
};

// Comprehensive file validation
export const validateFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file type
  if (!ALL_ALLOWED_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Only images, PDFs, and documents are allowed.'
    };
  }

  // Check file size based on type
  const category = getFileTypeCategory(file);
  let maxSize: number;

  switch (category) {
    case 'image':
      maxSize = FILE_SIZE_LIMITS.IMAGE;
      break;
    case 'pdf':
      maxSize = FILE_SIZE_LIMITS.PDF;
      break;
    case 'document':
      maxSize = FILE_SIZE_LIMITS.DOCUMENT;
      break;
    default:
      return { isValid: false, error: 'Unknown file type.' };
  }

  if (!validateFileSize(file, maxSize)) {
    return {
      isValid: false,
      error: `File size too large. Maximum size for ${category} files is ${maxSize}MB.`
    };
  }

  return { isValid: true };
};
