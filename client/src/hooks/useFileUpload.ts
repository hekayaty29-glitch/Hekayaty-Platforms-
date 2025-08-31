import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { 
  uploadAvatar, 
  uploadStoryCover, 
  uploadStoryPoster, 
  uploadStoryPDF, 
  uploadStoryImages, 
  uploadFile,
  validateFile,
  UploadResponse,
  MultipleUploadResponse
} from '@/lib/upload';
import { useToast } from '@/hooks/use-toast';

export type UploadType = 'avatar' | 'story-cover' | 'story-poster' | 'story-pdf' | 'story-images' | 'file';

interface UseFileUploadOptions {
  onSuccess?: (data: UploadResponse | MultipleUploadResponse) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

export const useFileUpload = (type: UploadType, options: UseFileUploadOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;
  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = useState(0);

  const getUploadFunction = (type: UploadType) => {
    switch (type) {
      case 'avatar':
        return (file: File) => uploadAvatar(file);
      case 'story-cover':
        return (file: File, storyId?: string) => uploadStoryCover(file, storyId);
      case 'story-poster':
        return (file: File, storyId?: string) => uploadStoryPoster(file, storyId);
      case 'story-pdf':
        return (file: File, storyId?: string) => uploadStoryPDF(file, storyId);
      case 'story-images':
        return (files: File[], storyId?: string) => uploadStoryImages(files, storyId);
      case 'file':
        return (file: File, folder?: string) => uploadFile(file, folder);
      default:
        throw new Error(`Unsupported upload type: ${type}`);
    }
  };

  const mutation = useMutation({
    mutationFn: async ({ files, storyId, folder }: { 
      files: File | File[]; 
      storyId?: string; 
      folder?: string; 
    }) => {
      const uploadFn: any = getUploadFunction(type);
      
      // Validate files
      const filesToValidate = Array.isArray(files) ? files : [files];
      for (const file of filesToValidate) {
        const validation = validateFile(file);
        if (!validation.isValid) {
          throw new Error(validation.error);
        }
      }

      // Simulate progress for single file uploads
      if (!Array.isArray(files)) {
        setUploadProgress(0);
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return prev + 10;
          });
        }, 200);
      }

      // Call appropriate upload function
      let result;
      if (type === 'story-images' && Array.isArray(files)) {
        result = await uploadFn(files, storyId);
      } else if (type === 'file' && !Array.isArray(files)) {
        result = await uploadFn(files, folder);
      } else if (!Array.isArray(files)) {
        result = await uploadFn(files, storyId);
      } else {
        throw new Error('Invalid file type for upload function');
      }

      setUploadProgress(100);
      return result;
    },
    onSuccess: (data) => {
      if (showToast) {
        toast({
          title: "Upload successful",
          description: data.message,
        });
      }
      setUploadProgress(0);
      onSuccess?.(data);
    },
    onError: (error: Error) => {
      if (showToast) {
        toast({
          title: "Upload failed",
          description: error.message,
          variant: "destructive",
        });
      }
      setUploadProgress(0);
      onError?.(error);
    },
  });

  const upload = (files: File | File[], storyId?: string, folder?: string) => {
    mutation.mutate({ files, storyId, folder });
  };

  return {
    upload,
    isUploading: mutation.isPending,
    uploadProgress,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
};

// Specialized hooks for common use cases
export const useAvatarUpload = (options?: UseFileUploadOptions) => {
  return useFileUpload('avatar', options);
};

export const useStoryCoverUpload = (options?: UseFileUploadOptions) => {
  return useFileUpload('story-cover', options);
};

export const useStoryPosterUpload = (options?: UseFileUploadOptions) => {
  return useFileUpload('story-poster', options);
};

export const useStoryPDFUpload = (options?: UseFileUploadOptions) => {
  return useFileUpload('story-pdf', options);
};

export const useStoryImagesUpload = (options?: UseFileUploadOptions) => {
  return useFileUpload('story-images', options);
};

export const useGeneralFileUpload = (options?: UseFileUploadOptions) => {
  return useFileUpload('file', options);
};
