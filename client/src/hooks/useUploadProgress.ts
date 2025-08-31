import { useState, useCallback } from 'react';

interface UploadFile {
  name: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export function useUploadProgress() {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const addFile = useCallback((fileName: string) => {
    setFiles(prev => [...prev, {
      name: fileName,
      progress: 0,
      status: 'uploading'
    }]);
    setIsVisible(true);
  }, []);

  const updateProgress = useCallback((fileName: string, progress: number) => {
    setFiles(prev => prev.map(file => 
      file.name === fileName 
        ? { ...file, progress, status: progress === 100 ? 'completed' : 'uploading' }
        : file
    ));
  }, []);

  const setError = useCallback((fileName: string, error: string) => {
    setFiles(prev => prev.map(file => 
      file.name === fileName 
        ? { ...file, status: 'error', error }
        : file
    ));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setIsVisible(false);
  }, []);

  const hideProgress = useCallback(() => {
    setIsVisible(false);
  }, []);

  return {
    files,
    isVisible,
    addFile,
    updateProgress,
    setError,
    clearFiles,
    hideProgress
  };
}
