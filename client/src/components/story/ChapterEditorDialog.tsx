import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Chapter } from './ChapterList';

interface ChapterEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chapter?: Partial<Chapter> | null;
  onSave: (chapterData: Pick<Chapter, 'title' | 'description'>) => void;
}

export function ChapterEditorDialog({
  open,
  onOpenChange,
  chapter,
  onSave,
}: ChapterEditorDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens/closes or chapter changes
  useEffect(() => {
    if (open) {
      setTitle(chapter?.title || '');
      setDescription(chapter?.description || '');
    } else {
      // Reset form when dialog closes
      setTitle('');
      setDescription('');
    }
  }, [open, chapter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      onSave({
        title: title.trim(),
        description: description.trim(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {chapter ? 'Edit Chapter' : 'Add New Chapter'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="chapter-title">Title</Label>
              <Input
                id="chapter-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Chapter title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="chapter-description">Description (Optional)</Label>
              <Textarea
                id="chapter-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description of this chapter"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Chapter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
