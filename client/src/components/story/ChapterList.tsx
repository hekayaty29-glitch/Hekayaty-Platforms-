import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, GripVertical, Trash2, Pencil } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface Chapter {
  id: string;
  title: string;
  description: string;
  order: number;
  scenes: any[];
  createdAt?: string;
  updatedAt?: string;
}

interface ChapterListProps {
  chapters: Chapter[];
  onAddChapter: () => void;
  onEditChapter: (chapter: Chapter) => void;
  onDeleteChapter: (chapterId: string) => void;
  onReorderChapters: (chapters: Chapter[]) => void;
  activeChapterId?: string;
}

const ChapterItem: React.FC<{
  chapter: Chapter;
  onEdit: (chapter: Chapter) => void;
  onDelete: (chapterId: string) => void;
  isActive: boolean;
}> = ({ chapter, onEdit, onDelete, isActive }) => {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-md border ${isActive ? 'bg-accent' : 'bg-background'}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-1 rounded hover:bg-muted cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium truncate">{chapter.title || 'Untitled Chapter'}</h4>
        {chapter.description && (
          <p className="text-sm text-muted-foreground truncate">{chapter.description}</p>
        )}
        <div className="text-xs text-muted-foreground mt-1">
          {chapter.scenes?.length || 0} scenes
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(chapter)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(chapter.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export const ChapterList: React.FC<ChapterListProps> = ({
  chapters = [],
  onAddChapter,
  onEditChapter,
  onDeleteChapter,
  onReorderChapters,
  activeChapterId,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Chapters</h3>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={onAddChapter}
        >
          <Plus className="h-4 w-4" />
          Add Chapter
        </Button>
      </div>
      
      <div className="space-y-2">
        {chapters.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No chapters yet. Add your first chapter to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {chapters.map((chapter) => (
              <ChapterItem
                key={chapter.id}
                chapter={chapter}
                onEdit={onEditChapter}
                onDelete={onDeleteChapter}
                isActive={chapter.id === activeChapterId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChapterList;
