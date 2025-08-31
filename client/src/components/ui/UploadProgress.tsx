import React from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Upload } from 'lucide-react';

interface UploadProgressProps {
  files: Array<{
    name: string;
    progress: number;
    status: 'uploading' | 'completed' | 'error';
    error?: string;
  }>;
  onClose?: () => void;
}

export function UploadProgress({ files, onClose }: UploadProgressProps) {
  const allCompleted = files.every(f => f.status === 'completed');
  const hasErrors = files.some(f => f.status === 'error');

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm w-full z-50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          <span className="font-medium text-sm">
            {allCompleted ? 'Upload Complete' : 'Uploading Files'}
          </span>
        </div>
        {(allCompleted || hasErrors) && onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            ×
          </button>
        )}
      </div>
      
      <div className="space-y-2">
        {files.map((file, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="truncate flex-1 mr-2">{file.name}</span>
              <div className="flex items-center gap-1">
                {file.status === 'completed' && (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                )}
                {file.status === 'error' && (
                  <AlertCircle className="h-3 w-3 text-red-500" />
                )}
                <span className="text-gray-500">
                  {file.status === 'completed' ? '100%' : `${file.progress}%`}
                </span>
              </div>
            </div>
            <Progress 
              value={file.progress} 
              className="h-1"
            />
            {file.error && (
              <p className="text-xs text-red-500">{file.error}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
