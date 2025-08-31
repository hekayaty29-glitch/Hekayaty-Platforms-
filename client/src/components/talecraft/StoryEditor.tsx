import { useState, useEffect, useRef } from "react";
import { DndContext, useSensor, useSensors, PointerSensor, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Heading2, 
  Heading3, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Plus,
  GripVertical,
  Trash2,
  Save
} from "lucide-react";
import clsx from "clsx";
import { supabase } from "@/lib/supabase";
import { PublishProjectDialog } from "./PublishProjectDialog";

interface Page {
  id: string;
  title: string;
  content: string;
  wordCount: number;
}

interface Chapter {
  id: string;
  title: string;
  pages: Page[];
  wordCount: number;
}

interface StoryProject {
  id: string;
  title: string;
  chapters: Chapter[];
  lastModified: Date;
}

interface SortableChapterProps {
  chapter: Chapter;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onAddPage: () => void;
}

function SortableChapter({ chapter, isSelected, onSelect, onDelete, onAddPage }: SortableChapterProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        "group flex items-center gap-2 p-3 rounded-lg border transition-all",
        isSelected 
          ? "bg-amber-500/20 border-amber-500 text-amber-100" 
          : "bg-gray-800/40 border-gray-700 hover:border-gray-600 text-gray-300",
        isDragging && "opacity-50"
      )}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-gray-500" />
      </div>
      
      <div className="flex-1 cursor-pointer" onClick={onSelect}>
        <div className="font-medium text-sm truncate">
          {chapter.title || "Untitled Chapter"}
        </div>
        <div className="text-xs text-gray-500">
          {chapter.pages.length} pages • {chapter.wordCount} words
        </div>
      </div>
      
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddPage}
          className="h-6 w-6 p-0 text-green-400 hover:text-green-300"
          title="Add Page"
        >
          <Plus className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
          title="Delete Chapter"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

interface StoryEditorProps {
  project: StoryProject;
  onProjectUpdate: (project: StoryProject) => void;
}

export default function StoryEditor({ project, onProjectUpdate }: StoryEditorProps) {
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(
    project.chapters[0]?.id || null
  );
  const [selectedPageId, setSelectedPageId] = useState<string | null>(
    project.chapters[0]?.pages[0]?.id || null
  );
  const [isPreview, setIsPreview] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const editorRef = useRef<HTMLDivElement>(null);
  
  const sensors = useSensors(useSensor(PointerSensor));
  
  const selectedChapter = project.chapters.find(c => c.id === selectedChapterId);
  const selectedPage = selectedChapter?.pages.find(p => p.id === selectedPageId);

  // Auto-save functionality
  useEffect(() => {
    const timer = setTimeout(() => {
      if (autoSaveStatus === "unsaved") {
        setAutoSaveStatus("saving");
        // Simulate save delay
        setTimeout(() => setAutoSaveStatus("saved"), 500);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [autoSaveStatus]);

  const updateProject = (updates: Partial<StoryProject>) => {
    const updatedProject = { ...project, ...updates, lastModified: new Date() };
    onProjectUpdate(updatedProject);
    setAutoSaveStatus("unsaved");
  };

  const addChapter = () => {
    const newPage: Page = {
      id: crypto.randomUUID(),
      title: "Page 1",
      content: "",
      wordCount: 0
    };
    
    const newChapter: Chapter = {
      id: crypto.randomUUID(),
      title: `Chapter ${project.chapters.length + 1}`,
      pages: [newPage],
      wordCount: 0
    };
    
    updateProject({
      chapters: [...project.chapters, newChapter]
    });
    setSelectedChapterId(newChapter.id);
    setSelectedPageId(newPage.id);
  };

  const addPageToChapter = (chapterId: string) => {
    const chapter = project.chapters.find(c => c.id === chapterId);
    if (!chapter) return;
    
    const newPage: Page = {
      id: crypto.randomUUID(),
      title: `Page ${chapter.pages.length + 1}`,
      content: "",
      wordCount: 0
    };
    
    const updatedChapters = project.chapters.map(c => {
      if (c.id === chapterId) {
        return {
          ...c,
          pages: [...c.pages, newPage]
        };
      }
      return c;
    });
    
    updateProject({ chapters: updatedChapters });
    setSelectedChapterId(chapterId);
    setSelectedPageId(newPage.id);
  };

  const updatePage = (pageId: string, updates: Partial<Page>) => {
    const updatedChapters = project.chapters.map(chapter => {
      const updatedPages = chapter.pages.map(page => {
        if (page.id === pageId) {
          const updatedPage = { ...page, ...updates };
          if (updates.content) {
            updatedPage.wordCount = updates.content
              .replace(/<[^>]*>/g, '')
              .split(/\s+/)
              .filter(word => word.length > 0).length;
          }
          return updatedPage;
        }
        return page;
      });
      
      if (updatedPages !== chapter.pages) {
        const totalWordCount = updatedPages.reduce((sum, page) => sum + page.wordCount, 0);
        return { ...chapter, pages: updatedPages, wordCount: totalWordCount };
      }
      return chapter;
    });
    
    updateProject({ chapters: updatedChapters });
  };

  const updateChapter = (chapterId: string, updates: Partial<Chapter>) => {
    const updatedChapters = project.chapters.map(chapter => {
      if (chapter.id === chapterId) {
        return { ...chapter, ...updates };
      }
      return chapter;
    });
    
    updateProject({ chapters: updatedChapters });
  };

  const deleteChapter = (chapterId: string) => {
    const updatedChapters = project.chapters.filter(c => c.id !== chapterId);
    updateProject({ chapters: updatedChapters });
    
    if (selectedChapterId === chapterId) {
      const newSelectedChapter = updatedChapters[0];
      setSelectedChapterId(newSelectedChapter?.id || null);
      setSelectedPageId(newSelectedChapter?.pages[0]?.id || null);
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = project.chapters.findIndex(c => c.id === active.id);
    const newIndex = project.chapters.findIndex(c => c.id === over.id);
    
    updateProject({
      chapters: arrayMove(project.chapters, oldIndex, newIndex)
    });
  };

  // Helper function to save the current editor content
  const saveEditorContent = () => {
    if (selectedPage && editorRef.current) {
      updatePage(selectedPage.id, { 
        content: editorRef.current.innerHTML 
      });
    }
  };

  // Format text using document.execCommand with type safety
  const formatText = (command: string, value?: string) => {
    try {
      // Focus the editor if it's not already focused
      if (editorRef.current && document.activeElement !== editorRef.current) {
        editorRef.current.focus();
      }
      
      // Execute the command
      const success = document.execCommand(command, false, value);
      
      // Save the content after formatting
      if (success) {
        saveEditorContent();
      }
      
      return success;
    } catch (error) {
      console.error('Error formatting text:', error);
      return false;
    }
  };
  
  // Check if a format is currently active
  const isFormatActive = (command: string, value?: string): boolean => {
    try {
      return document.queryCommandState(command);
    } catch (error) {
      console.error('Error checking format state:', error);
      return false;
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'story-content');

    const resp = await fetch('/api/upload/file', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!resp.ok) {
      throw new Error('Image upload failed');
    }
    const json = await resp.json();
    return json.url as string;
  };

  const insertImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !editorRef.current) return;

      // Create a loading placeholder
      const placeholder = document.createElement('div');
      placeholder.className = 'bg-gray-800 p-4 rounded-lg border border-dashed border-gray-600 text-center my-2';
      placeholder.textContent = 'Uploading image...';
      
      // Insert placeholder at cursor position or at the end
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(placeholder);
        
        // Move cursor after the placeholder
        const newRange = document.createRange();
        newRange.setStartAfter(placeholder);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      } else {
        editorRef.current.appendChild(placeholder);
      }

      try {
        // Upload to Cloudinary
        const url = await uploadImage(file);
        
        const img = document.createElement('img');
        img.src = url;
        img.className = 'max-w-full h-auto rounded-lg my-2 mx-auto';
        img.alt = 'Uploaded content';
        
        // Replace the placeholder with the actual image
        placeholder.replaceWith(img);
        
        // Save the updated content
        saveEditorContent();
      } catch (error) {
        console.error('Error uploading image:', error);
        placeholder.textContent = 'Error uploading image';
        placeholder.className = 'text-red-400 my-2';
      }
    };
    input.click();
  };

  return (
    <>
      <PublishProjectDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        defaultValues={{
          title: project.title,
          description: "",
          projectType: "story",
          content: project,
        }}
        onPublished={(id) => alert("Project published! ID: " + id)}
      />
      <div className="flex h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950">
      {/* Sidebar */}
      <aside className="w-80 border-r border-gray-700 bg-gray-900/50 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <Input
            value={project.title}
            onChange={(e) => updateProject({ title: e.target.value })}
            className="text-lg font-semibold bg-transparent border-none p-0 focus-visible:ring-0"
            placeholder="Story Title"
          />
          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
            <span>{project.chapters.length} chapters</span>
            <span className={clsx(
              "flex items-center gap-1",
              autoSaveStatus === "saved" && "text-green-400",
              autoSaveStatus === "saving" && "text-yellow-400",
              autoSaveStatus === "unsaved" && "text-red-400"
            )}>
              <Save className="h-3 w-3" />
              {autoSaveStatus === "saved" && "Saved"}
              {autoSaveStatus === "saving" && "Saving..."}
              {autoSaveStatus === "unsaved" && "Unsaved"}
            </span>
          </div>
        </div>

        <div className="p-4">
          <Button onClick={addChapter} className="w-full mb-4" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Chapter
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={project.chapters.map(c => c.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {project.chapters.map((chapter) => (
                  <div key={chapter.id} className="space-y-2">
                    <SortableChapter
                      chapter={chapter}
                      isSelected={selectedChapterId === chapter.id}
                      onSelect={() => {
                        setSelectedChapterId(chapter.id);
                        setSelectedPageId(chapter.pages[0]?.id || null);
                      }}
                      onDelete={() => deleteChapter(chapter.id)}
                      onAddPage={() => addPageToChapter(chapter.id)}
                    />
                    
                    {/* Pages within chapter */}
                    {selectedChapterId === chapter.id && (
                      <div className="ml-6 space-y-1">
                        {chapter.pages.map((page) => (
                          <div
                            key={page.id}
                            className={clsx(
                              "flex items-center justify-between p-2 rounded text-sm cursor-pointer transition-colors",
                              selectedPageId === page.id
                                ? "bg-blue-500/20 text-blue-100 border border-blue-500/50"
                                : "bg-gray-700/40 text-gray-300 hover:bg-gray-600/60"
                            )}
                            onClick={() => setSelectedPageId(page.id)}
                          >
                            <div className="flex-1">
                              <div className="font-medium truncate">
                                {page.title || "Untitled Page"}
                              </div>
                              <div className="text-xs text-gray-500">
                                {page.wordCount} words
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Delete page logic here
                              }}
                              className="h-6 w-6 p-0 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </aside>

      {/* Main Editor */}
      <main className="flex-1 flex flex-col">
        {selectedPage && (
          <>
            {/* Toolbar */}
            <div className="border-b border-gray-700 bg-gray-800/50 p-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1">
                  <Button 
                    variant={isFormatActive('bold') ? 'secondary' : 'ghost'} 
                    size="sm" 
                    onClick={() => formatText('bold')}
                    title="Bold (Ctrl+B)"
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={isFormatActive('italic') ? 'secondary' : 'ghost'} 
                    size="sm" 
                    onClick={() => formatText('italic')}
                    title="Italic (Ctrl+I)"
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={isFormatActive('underline') ? 'secondary' : 'ghost'} 
                    size="sm" 
                    onClick={() => formatText('underline')}
                    title="Underline (Ctrl+U)"
                  >
                    <Underline className="h-4 w-4" />
                  </Button>
                </div>

                <Separator orientation="vertical" className="h-6" />

                <div className="flex items-center gap-1">
                  <Button 
                    variant={isFormatActive('formatBlock', 'h2') ? 'secondary' : 'ghost'} 
                    size="sm" 
                    onClick={() => formatText('formatBlock', '<h2>')}
                    title="Heading 2"
                  >
                    <Heading2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={isFormatActive('formatBlock', 'h3') ? 'secondary' : 'ghost'}
                    size="sm" 
                    onClick={() => formatText('formatBlock', '<h3>')}
                    title="Heading 3"
                  >
                    <Heading3 className="h-4 w-4" />
                  </Button>
                </div>

                <Separator orientation="vertical" className="h-6" />

                <div className="flex items-center gap-1">
                  <Button 
                    variant={isFormatActive('justifyLeft') ? 'secondary' : 'ghost'} 
                    size="sm" 
                    onClick={() => formatText('justifyLeft')}
                    title="Align Left"
                  >
                    <AlignLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={isFormatActive('justifyCenter') ? 'secondary' : 'ghost'}
                    size="sm" 
                    onClick={() => formatText('justifyCenter')}
                    title="Center"
                  >
                    <AlignCenter className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={isFormatActive('justifyRight') ? 'secondary' : 'ghost'}
                    size="sm" 
                    onClick={() => formatText('justifyRight')}
                    title="Align Right"
                  >
                    <AlignRight className="h-4 w-4" />
                  </Button>
                </div>

                <Separator orientation="vertical" className="h-6" />

                <div className="flex items-center gap-1">
                  <Button 
                    variant={isFormatActive('insertUnorderedList') ? 'secondary' : 'ghost'}
                    size="sm" 
                    onClick={() => formatText('insertUnorderedList')}
                    title="Bullet List"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={isFormatActive('insertOrderedList') ? 'secondary' : 'ghost'}
                    size="sm" 
                    onClick={() => formatText('insertOrderedList')}
                    title="Numbered List"
                  >
                    <ListOrdered className="h-4 w-4" />
                  </Button>
                </div>

                <Separator orientation="vertical" className="h-6" />

                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={insertImage}
                  title="Insert Image"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>

                <div className="ml-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsPreview(!isPreview)}
                  >
                    {isPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {isPreview ? "Edit" : "Preview"}
                  </Button>
                  <Button variant="default" size="sm" onClick={() => setPublishOpen(true)}>
                    Publish
                  </Button>
                </div>
              </div>
            </div>

            {/* Page Title */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-400">
                  {selectedChapter?.title}
                </div>
                <div className="text-gray-600">•</div>
                <Input
                  value={selectedPage.title}
                  onChange={(e) => updatePage(selectedPage.id, { title: e.target.value })}
                  className="text-xl font-semibold bg-transparent border-none p-0 focus-visible:ring-0 flex-1"
                  placeholder="Page Title"
                />
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
              {isPreview ? (
                <article 
                  className="prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedPage.content }}
                />
              ) : (
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  className="min-h-[60vh] focus:outline-none prose prose-invert max-w-none"
                  style={{ direction: 'ltr' }} // Support for RTL can be toggled
                  onInput={(e) => {
                    updatePage(selectedPage.id, { 
                      content: e.currentTarget.innerHTML 
                    });
                  }}
                  dangerouslySetInnerHTML={{ __html: selectedPage.content }}
                />
              )}
            </div>
          </>
        )}

        {!selectedPage && (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">No Page Selected</h3>
              <p>Create a new chapter or select a page to start writing.</p>
            </div>
          </div>
        )}
      </main>
    </div>
    </>
  );
}
