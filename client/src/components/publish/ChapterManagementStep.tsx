import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, X, ArrowRight, ArrowLeft, GripVertical, FileText, File } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Chapter {
  id: string;
  name: string;
  file: File;
  order: number;
}

interface ChapterManagementStepProps {
  data: {
    chapters: Chapter[];
  };
  onUpdate: (updates: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

function SortableChapter({ chapter, onRemove, onRename }: { 
  chapter: Chapter; 
  onRemove: (id: string) => void;
  onRename: (id: string, name: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(chapter.name);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSave = () => {
    onRename(chapter.id, editName);
    setIsEditing(false);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg','jpeg','png'].includes(ext || '')) return <File className="h-4 w-4 text-green-500" />;
    if (['mp3','wav'].includes(ext || '')) return <File className="h-4 w-4 text-purple-500" />;
    return ext === 'pdf' ? <File className="h-4 w-4 text-red-500" /> : <FileText className="h-4 w-4 text-blue-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 bg-white border rounded-lg shadow-sm"
    >
      <div {...attributes} {...listeners} className="cursor-grab hover:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-gray-400" />
      </div>
      
      <div className="flex items-center gap-2 flex-1">
        {getFileIcon(chapter.file.name)}
        <div className="flex-1">
          {isEditing ? (
            <div className="flex gap-2">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                className="h-8"
              />
              <Button size="sm" onClick={handleSave}>Save</Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            </div>
          ) : (
            <div>
              <div className="font-medium flex items-center gap-2">
                  {chapter.name}
                  {/* preview */}
                  {(() => {
                    const ext = chapter.file.name.split('.').pop()?.toLowerCase();
                    if (['jpg','jpeg','png'].includes(ext || '')) {
                      return <img src={URL.createObjectURL(chapter.file)} alt="preview" className="h-8 w-8 object-cover rounded" />;
                    }
                    if (['mp3','wav'].includes(ext || '')) {
                      return <audio controls src={URL.createObjectURL(chapter.file)} className="h-8" />;
                    }
                    return null;
                  })()}
                </div>
              <div className="text-sm text-gray-500">
                {chapter.file.name} • {formatFileSize(chapter.file.size)}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsEditing(true)}
        >
          Rename
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onRemove(chapter.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function ChapterManagementStep({ data, onUpdate, onNext, onPrevious }: ChapterManagementStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFiles = (files: FileList) => {
    const newChapters: Chapter[] = [];
    
    Array.from(files).forEach((file, index) => {
      // Validate file type
      const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown', 'audio/mpeg', 'audio/wav', 'image/jpeg', 'image/png'];
      const allowedExtensions = ['.pdf', '.txt', '.md', '.mp3', '.wav', '.jpg', '.jpeg', '.png'];
      const hasValidExtension = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
      
      if (file.type && !allowedTypes.includes(file.type) && !hasValidExtension) {
        setErrors(prev => ({ ...prev, files: 'Only PDF, TXT, and MD files are allowed' }));
        return;
      }

      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, files: 'Files must be less than 50MB' }));
        return;
      }

      const chapterName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      newChapters.push({
        id: `chapter-${Date.now()}-${index}`,
        name: chapterName,
        file,
        order: data.chapters.length + index
      });
    });

    if (newChapters.length > 0) {
      onUpdate({ chapters: [...data.chapters, ...newChapters] });
      setErrors(prev => ({ ...prev, files: "" }));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeChapter = (id: string) => {
    const updatedChapters = data.chapters.filter(ch => ch.id !== id);
    onUpdate({ chapters: updatedChapters });
  };

  const renameChapter = (id: string, newName: string) => {
    const updatedChapters = data.chapters.map(ch => 
      ch.id === id ? { ...ch, name: newName } : ch
    );
    onUpdate({ chapters: updatedChapters });
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = data.chapters.findIndex(ch => ch.id === active.id);
      const newIndex = data.chapters.findIndex(ch => ch.id === over.id);
      
      const reorderedChapters = arrayMove(data.chapters, oldIndex, newIndex).map((ch, index) => ({
        ...ch,
        order: index
      }));
      
      onUpdate({ chapters: reorderedChapters });
    }
  };

  const validateAndNext = () => {
    if (data.chapters.length === 0) {
      setErrors({ chapters: "Please add at least one chapter" });
      return;
    }
    setErrors({});
    onNext();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chapter Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Area */}
        <div>
          <Label>Upload Chapters</Label>
          <div
            className={`mt-2 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-amber-500 bg-amber-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragActive(false);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium">Drop your chapter files here</p>
              <p className="text-sm text-gray-500">or</p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse Files
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Supported: PDF, TXT, MD, MP3, WAV, JPG, PNG (up to 50MB each)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.txt,.md,.mp3,.wav,.jpg,.jpeg,.png"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
          {errors.files && <p className="text-red-500 text-sm mt-2">{errors.files}</p>}
        </div>

        {/* Chapters List */}
        {data.chapters.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label>Chapters ({data.chapters.length})</Label>
              <Badge variant="outline">Drag to reorder</Badge>
            </div>
            
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={data.chapters.map(ch => ch.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {data.chapters.map((chapter) => (
                    <SortableChapter
                      key={chapter.id}
                      chapter={chapter}
                      onRemove={removeChapter}
                      onRename={renameChapter}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}

        {errors.chapters && <p className="text-red-500 text-sm">{errors.chapters}</p>}

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onPrevious} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button onClick={validateAndNext} className="flex items-center gap-2">
            Next: Preview & Publish
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
