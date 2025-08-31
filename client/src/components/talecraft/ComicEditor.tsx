import { useState, useRef, useEffect } from "react";
import { DndContext, useSensor, useSensors, PointerSensor, DragEndEvent } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { 
  Type, 
  Image as ImageIcon, 
  Square, 
  MessageCircle,
  Palette,
  Layers,
  Grid3X3,
  RotateCcw,
  RotateCw,
  Trash2,
  Plus,
  Download
} from "lucide-react";
import clsx from "clsx";
import { attemptDownload } from "@/lib/downloadGate";
import { PublishProjectDialog } from "./PublishProjectDialog";
import { useRoles } from "@/hooks/useRoles";
import { supabase } from "@/lib/supabase";
import { uploadComicImage } from "@/lib/fastUpload";

interface ComicElement {
  id: string;
  type: 'text' | 'image' | 'panel' | 'bubble';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  rotation?: number;
  zIndex: number;
  imageUrl?: string;
  bubbleType?: 'speech' | 'thought' | 'shout';
  tailX?: number;
  tailY?: number;
}

interface ComicProject {
  id: string;
  title: string;
  pages: ComicPage[];
  lastModified: Date;
}

interface ComicPage {
  id: string;
  title: string;
  elements: ComicElement[];
  backgroundColor: string;
}

// Professional comic panel layouts with proper gutters and margins
// Based on standard comic book dimensions (6.625" x 10.25" trim size)
const PANEL_LAYOUTS = [
  {
    name: "Full Page Splash",
    description: "Single dramatic panel",
    grid: "1x1",
    elements: [{ x: 20, y: 20, width: 760, height: 1060 }]
  },
  {
    name: "Two Tier Horizontal",
    description: "Classic two-panel layout",
    grid: "2x1",
    elements: [
      { x: 20, y: 20, width: 760, height: 520 },
      { x: 20, y: 560, width: 760, height: 520 }
    ]
  },
  {
    name: "Three Tier Vertical",
    description: "Traditional three-panel strip",
    grid: "1x3",
    elements: [
      { x: 20, y: 20, width: 760, height: 346 },
      { x: 20, y: 386, width: 760, height: 346 },
      { x: 20, y: 752, width: 760, height: 328 }
    ]
  },
  {
    name: "Four Panel Grid",
    description: "Balanced 2x2 layout",
    grid: "2x2",
    elements: [
      { x: 20, y: 20, width: 370, height: 520 },
      { x: 410, y: 20, width: 370, height: 520 },
      { x: 20, y: 560, width: 370, height: 520 },
      { x: 410, y: 560, width: 370, height: 520 }
    ]
  },
  {
    name: "Six Panel Grid",
    description: "Dense storytelling layout",
    grid: "2x3",
    elements: [
      { x: 20, y: 20, width: 370, height: 340 },
      { x: 410, y: 20, width: 370, height: 340 },
      { x: 20, y: 380, width: 370, height: 340 },
      { x: 410, y: 380, width: 370, height: 340 },
      { x: 20, y: 740, width: 370, height: 340 },
      { x: 410, y: 740, width: 370, height: 340 }
    ]
  },
  {
    name: "Widescreen Action",
    description: "Cinematic panels",
    grid: "Wide",
    elements: [
      { x: 20, y: 20, width: 760, height: 250 },
      { x: 20, y: 290, width: 370, height: 400 },
      { x: 410, y: 290, width: 370, height: 400 },
      { x: 20, y: 710, width: 760, height: 370 }
    ]
  },
  {
    name: "Manga Style",
    description: "Vertical reading flow",
    grid: "Manga",
    elements: [
      { x: 20, y: 20, width: 760, height: 200 },
      { x: 20, y: 240, width: 240, height: 300 },
      { x: 280, y: 240, width: 500, height: 300 },
      { x: 20, y: 560, width: 370, height: 250 },
      { x: 410, y: 560, width: 370, height: 250 },
      { x: 20, y: 830, width: 760, height: 250 }
    ]
  },
  {
    name: "Hero Focus",
    description: "Large center with supporting panels",
    grid: "Hero",
    elements: [
      { x: 20, y: 20, width: 240, height: 300 },
      { x: 280, y: 20, width: 500, height: 600 },
      { x: 20, y: 340, width: 240, height: 280 },
      { x: 20, y: 640, width: 760, height: 440 }
    ]
  }
];

interface ComicEditorProps {
  project: ComicProject;
  onProjectUpdate: (project: ComicProject) => void;
  onPublish: () => void;
}

export default function ComicEditor({ project, onProjectUpdate, onPublish }: ComicEditorProps) {
  const roles = useRoles();

  // Ensure we have at least one page
  const [selectedPageId, setSelectedPageId] = useState(() => {
    return project.pages.length > 0 ? project.pages[0].id : '';
  });

  // Create default page if needed (in useEffect to avoid setState during render)
  useEffect(() => {
    if (project.pages.length === 0) {
      const defaultPage: ComicPage = {
        id: crypto.randomUUID(),
        title: 'Page 1',
        elements: [],
        backgroundColor: '#ffffff'
      };
      onProjectUpdate({
        ...project,
        pages: [defaultPage],
        lastModified: new Date()
      });
      setSelectedPageId(defaultPage.id);
    }
  }, [project.pages.length, project, onProjectUpdate]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [tool, setTool] = useState<'select' | 'text' | 'image' | 'panel' | 'bubble'>('select');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; panelId: string } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedElementId) {
        deleteElement(selectedElementId);
      } else if (e.key === 'Escape') {
        setSelectedElementId(null);
        setContextMenu(null);
        setTool('select');
      } else if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 't':
            e.preventDefault();
            setTool('text');
            break;
          case 'i':
            e.preventDefault();
            setTool('image');
            break;
          case 'p':
            e.preventDefault();
            setTool('panel');
            break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId]);
  
  const sensors = useSensors(useSensor(PointerSensor));
  const selectedPage = project.pages.find(p => p.id === selectedPageId);
  const selectedElement = selectedPage?.elements.find(e => e.id === selectedElementId);

  const updateProject = (updates: Partial<ComicProject>) => {
    const updatedProject = { ...project, ...updates, lastModified: new Date() };
    onProjectUpdate(updatedProject);
  };

  const addPage = () => {
    const newPage: ComicPage = {
      id: crypto.randomUUID(),
      title: `Page ${project.pages.length + 1}`,
      elements: [],
      backgroundColor: '#ffffff'
    };
    
    updateProject({
      pages: [...project.pages, newPage]
    });
    setSelectedPageId(newPage.id);
  };

  const deletePage = (pageId: string) => {
    if (project.pages.length <= 1) return; // Don't delete last page
    
    const updatedPages = project.pages.filter(p => p.id !== pageId);
    updateProject({ pages: updatedPages });
    
    // Select first page if current page was deleted
    if (selectedPageId === pageId) {
      setSelectedPageId(updatedPages[0]?.id || '');
    }
  };

  const updatePage = (pageId: string, updates: Partial<ComicPage>) => {
    console.log('updatePage called with:', pageId, updates);
    const updatedPages = project.pages.map(page => 
      page.id === pageId ? { ...page, ...updates } : page
    );
    console.log('Updated pages:', updatedPages);
    updateProject({ pages: updatedPages });
    console.log('Project updated');
  };

  const addElement = (type: ComicElement['type'], x: number = 100, y: number = 100, width?: number, height?: number) => {
    if (!selectedPage) {
      console.log('No selected page available');
      return;
    }

    console.log(`Adding ${type} element at position (${x}, ${y})`);

    const defaultWidth = type === 'text' ? 200 : type === 'bubble' ? 150 : type === 'panel' ? 300 : 100;
    const defaultHeight = type === 'text' ? 50 : type === 'bubble' ? 80 : type === 'panel' ? 200 : 100;

    const newElement: ComicElement = {
      id: crypto.randomUUID(),
      type,
      x,
      y,
      width: width || defaultWidth,
      height: height || defaultHeight,
      zIndex: selectedPage.elements.length,
      content: type === 'text' || type === 'bubble' ? 'Edit me' : undefined,
      fontSize: type === 'text' ? Math.max(12, Math.min(24, (width || defaultWidth) / 12)) : 16,
      fontFamily: 'Arial, sans-serif',
      color: '#000000',
      backgroundColor: type === 'panel' ? '#ffffff' : type === 'bubble' ? '#ffffff' : 'transparent',
      borderColor: '#000000',
      borderWidth: type === 'panel' ? 3 : type === 'bubble' ? 2 : 0,
      bubbleType: type === 'bubble' ? 'speech' : undefined,
      tailX: type === 'bubble' ? (width || defaultWidth) / 2 : undefined,
      tailY: type === 'bubble' ? (height || defaultHeight) : undefined
    };

    console.log('Created new element:', newElement);
    console.log('Current page elements before update:', selectedPage.elements.length);

    const updatedElements = [...selectedPage.elements, newElement];
    console.log('Updated elements array:', updatedElements.length);

    updatePage(selectedPage.id, {
      elements: updatedElements
    });
    
    console.log('Page updated, setting selected element ID:', newElement.id);
    setSelectedElementId(newElement.id);
  };

  const updateElement = (elementId: string, updates: Partial<ComicElement>) => {
    if (!selectedPage) return;

    const updatedElements = selectedPage.elements.map(element =>
      element.id === elementId ? { ...element, ...updates } : element
    );
    
    updatePage(selectedPage.id, { elements: updatedElements });
  };

  const deleteElement = (elementId: string) => {
    if (!selectedPage) return;

    const updatedElements = selectedPage.elements.filter(e => e.id !== elementId);
    updatePage(selectedPage.id, { elements: updatedElements });
    
    if (selectedElementId === elementId) {
      setSelectedElementId(null);
    }
  };

  const deleteSelectedPanel = () => {
    if (!selectedElement || selectedElement.type !== 'panel') return;
    deleteElement(selectedElement.id);
  };

  const addNewPanel = () => {
    if (!selectedPage) return;
    
    // Find a good position for new panel
    const existingPanels = selectedPage.elements.filter(e => e.type === 'panel');
    const x = 20 + (existingPanels.length % 2) * 400;
    const y = 20 + Math.floor(existingPanels.length / 2) * 250;
    
    addElement('panel', x, y, 300, 200);
  };

  const applyLayout = (layout: typeof PANEL_LAYOUTS[0]) => {
    console.log('Applying layout:', layout.name);
    if (!selectedPage) {
      console.log('No selected page');
      return;
    }

    const panelElements: ComicElement[] = layout.elements.map((pos, index) => ({
      id: crypto.randomUUID(),
      type: 'panel' as const,
      x: pos.x,
      y: pos.y,
      width: pos.width,
      height: pos.height,
      zIndex: selectedPage.elements.length + index,
      backgroundColor: '#f8f9fa',
      borderColor: '#000000',
      borderWidth: 2
    }));

    console.log('Adding panel elements:', panelElements.length);
    updatePage(selectedPage.id, {
      elements: [...selectedPage.elements, ...panelElements]
    });
    // After inserting a layout, switch back to the select tool so users can immediately interact with panels
    setTool('select');
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Close context menu if clicking elsewhere
    setContextMenu(null);
    
    if (tool === 'select') return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'image') {
      // For image tool, trigger file upload immediately
      insertImageAtPosition(x, y);
    } else {
      addElement(tool, x, y);
    }
    setTool('select');
  };

  const handlePanelClick = (e: React.MouseEvent, panelId: string) => {
    e.stopPropagation();
    
    if (tool === 'select') {
      // Show context menu for panel
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setContextMenu({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          panelId
        });
      }
    } else {
      setSelectedElementId(panelId);
    }
  };

  const addToPanel = (panelId: string, type: 'text' | 'image') => {
    const panel = selectedPage?.elements.find(el => el.id === panelId);
    if (!panel) return;

    // Calculate optimal sizing within panel bounds (with 10px padding)
    const padding = 10;
    const availableWidth = panel.width - (padding * 2);
    const availableHeight = panel.height - (padding * 2);
    
    if (type === 'image') {
    // Fill the panel area entirely (object-fit: cover behaviour is simulated by stretching)
    const imageWidth = availableWidth;
    const imageHeight = availableHeight;

    const imageX = panel.x + padding;
    const imageY = panel.y + padding;

    insertImageAtPosition(imageX, imageY, imageWidth, imageHeight, panelId);
  } else {
      // Create text that fits well in the panel
      const textWidth = availableWidth * 0.9;
      const textHeight = Math.min(60, availableHeight * 0.3);
      
      const textX = panel.x + (panel.width - textWidth) / 2;
      const textY = panel.y + (panel.height - textHeight) / 2;
      
      addElement('text', textX, textY, textWidth, textHeight);
    }
    
    setContextMenu(null);
  };

  const uploadImage = async (file: File, onProgress?: (progress: number) => void): Promise<string> => {
    try {
      const result = await uploadComicImage(file, onProgress);
      return result.url;
    } catch (error) {
      console.error('Image upload failed:', error);
      throw new Error('Image upload failed');
    }
  };

  const insertImageAtPosition = (x: number, y: number, width?: number, height?: number, panelId?: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        uploadImage(file)
          .then((url) => {
            // Helper to commit the element to state
            const commitElement = (
              finalX: number,
              finalY: number,
              finalWidth: number,
              finalHeight: number
            ) => {
              const newElement = {
                id: crypto.randomUUID(),
                type: 'image' as const,
                x: finalX,
                y: finalY,
                width: finalWidth,
                height: finalHeight,
                zIndex: selectedPage?.elements.length || 0,
                imageUrl: url,
                panelId: panelId,
                backgroundColor: 'transparent',
                borderColor: '#000000',
                borderWidth: 0
              } as const;

              if (selectedPage) {
                updatePage(selectedPage.id, {
                  elements: [...selectedPage.elements, newElement]
                });
                setSelectedElementId(newElement.id);
              }
            };

            // If the image is being inserted into a panel, fit it nicely
            if (panelId && selectedPage) {
              const panel = selectedPage.elements.find(el => el.id === panelId);
              if (panel) {
                const padding = 10;
                const availableWidth = panel.width - (padding * 2);
                const availableHeight = panel.height - (padding * 2);
                
                const imageWidth = availableWidth;
                const imageHeight = availableHeight;

                const imageX = panel.x + padding;
                const imageY = panel.y + padding;
                  
                commitElement(imageX, imageY, imageWidth, imageHeight);
                return;
              }
            }

            // Fallback: commit with provided dimensions
            commitElement(x, y, width || 200, height || 150);  
          })
          .catch((error) => {
            console.error('Image upload failed:', error);
            alert('Failed to upload image. Please try again.');
          });
      }
    };
    input.click();
  };

  const deleteSelectedElement = () => {
    if (selectedElementId) {
      deleteElement(selectedElementId);
    }
  };

  const insertImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        uploadImage(file)
          .then((url) => {
            if (selectedElement && selectedElement.type === 'image') {
              updateElement(selectedElement.id, { imageUrl: url });
            } else {
              // Add image at center of canvas
              addElement('image', 350, 250);
              // Set image after element is created
              setTimeout(() => {
                if (selectedPage) {
                  const newElements = selectedPage.elements;
                  const lastElement = newElements[newElements.length - 1];
                  if (lastElement && lastElement.type === 'image') {
                    updateElement(lastElement.id, { imageUrl: url });
                  }
                }
              }, 100);
            }
          })
          .catch((error) => {
            console.error('Image upload failed:', error);
            alert('Failed to upload image. Please try again.');
          });
      }
    };
    input.click();
  };

  const addQuickText = () => {
    addElement('text', 300, 200);
  };

  const addQuickImage = () => {
    insertImage();
  };

  const addImageToAllPanels = () => {
    if (!selectedPage) return;
    
    const panels = selectedPage.elements.filter(el => el.type === 'panel');
    if (panels.length === 0) {
      alert('Please add panels first before adding images to all panels.');
      return;
    }
    
    let processedPanels = 0;
    
    const processNextPanel = () => {
      if (processedPanels >= panels.length) return;
      
      const panel = panels[processedPanels];
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = false;
      
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          uploadImage(file)
            .then((url) => {
              // Calculate optimal sizing within panel bounds
              const padding = 10;
              const availableWidth = panel.width - (padding * 2);
              const availableHeight = panel.height - (padding * 2);
              
              const imageWidth = availableWidth;
              const imageHeight = availableHeight;

              const imageX = panel.x + padding;
              const imageY = panel.y + padding;
              
              const newElement = {
                id: crypto.randomUUID(),
                type: 'image' as const,
                x: imageX,
                y: imageY,
                width: imageWidth,
                height: imageHeight,
                zIndex: selectedPage.elements.length + processedPanels,
                imageUrl: url,
                panelId: panel.id,
                backgroundColor: 'transparent',
                borderColor: '#000000',
                borderWidth: 0
              };
              
              if (selectedPage) {
                updatePage(selectedPage.id, {
                  elements: [...selectedPage.elements, newElement]
                });
              }
              
              processedPanels++;
              // Small delay before processing next panel
              setTimeout(() => processNextPanel(), 500);
            })
            .catch((error) => {
              console.error('Image upload failed:', error);
              processedPanels++;
              processNextPanel();
            });
        } else {
          processedPanels++;
          processNextPanel();
        }
      };
      
      input.oncancel = () => {
        processedPanels++;
        processNextPanel();
      };
      
      input.click();
    };
    
    processNextPanel();
  };

  const exportPage = () => {
    if (!selectedPage || !canvasRef.current) return;
    
    // Create a high-resolution canvas for export
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set high resolution for print quality (300 DPI equivalent)
    const scale = 3;
    canvas.width = 800 * scale;
    canvas.height = 1100 * scale;
    ctx.scale(scale, scale);
    
    // White background
    ctx.fillStyle = selectedPage.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, 800, 1100);
    
    // Draw all elements
    selectedPage.elements
      .sort((a, b) => a.zIndex - b.zIndex)
      .forEach(element => {
        ctx.save();
        
        if (element.type === 'panel') {
          ctx.fillStyle = element.backgroundColor || '#ffffff';
          ctx.fillRect(element.x, element.y, element.width, element.height);
          ctx.strokeStyle = element.borderColor || '#000000';
          ctx.lineWidth = element.borderWidth || 3;
          ctx.strokeRect(element.x, element.y, element.width, element.height);
        } else if (element.type === 'text' || element.type === 'bubble') {
          if (element.type === 'bubble') {
            // Draw bubble background
            ctx.fillStyle = element.backgroundColor || '#ffffff';
            ctx.fillRect(element.x, element.y, element.width, element.height);
            ctx.strokeStyle = element.borderColor || '#000000';
            ctx.lineWidth = element.borderWidth || 2;
            ctx.strokeRect(element.x, element.y, element.width, element.height);
          }
          
          // Draw text
          ctx.fillStyle = element.color || '#000000';
          ctx.font = `${element.fontSize || 16}px ${element.fontFamily || 'Arial'}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          const text = element.content || '';
          const lines = text.split('\n');
          const lineHeight = (element.fontSize || 16) * 1.2;
          const startY = element.y + element.height / 2 - (lines.length - 1) * lineHeight / 2;
          
          lines.forEach((line, index) => {
            ctx.fillText(
              line,
              element.x + element.width / 2,
              startY + index * lineHeight
            );
          });
        }
        
        ctx.restore();
      });
    
    // Download the image
    const link = document.createElement('a');
    link.download = `${project.title || 'comic'}-page-${selectedPage.title || 'untitled'}.png`;
    link.href = canvas.toDataURL('image/png');
    attemptDownload(() => link.click(), roles);
  };

  // Publish dialog state
  const [publishOpen, setPublishOpen] = useState(false);

  const handlePublished = (id: string) => {
    alert("Project published! ID: " + id);
  };

  return (
    <>
      <PublishProjectDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        defaultValues={{
          title: project.title,
          description: "",
          projectType: "comic",
          content: project,
        }}
        onPublished={handlePublished}
      />
      <div className="flex h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950">
      {/* Sidebar */}
      <aside className="w-80 border-r border-gray-700 bg-gray-900/50 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <Input
            value={project.title}
            onChange={(e) => updateProject({ title: e.target.value })}
            className="text-lg font-semibold bg-transparent border-none p-0 focus-visible:ring-0"
            placeholder="Comic Title"
          />
        </div>

        {/* Pages */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-300">Pages</h3>
            <Button size="sm" variant="outline" onClick={addPage}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {project.pages.map((page) => (
              <div
                key={page.id}
                className={clsx(
                  "p-2 rounded cursor-pointer text-sm flex items-center justify-between group",
                  selectedPageId === page.id
                    ? "bg-amber-500/20 text-amber-100"
                    : "bg-gray-800/40 text-gray-300 hover:bg-gray-700/60"
                )}
                onClick={() => setSelectedPageId(page.id)}
              >
                <span>{page.title}</span>
                {project.pages.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePage(page.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tools */}
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-sm font-semibold mb-3 text-gray-300">Tools</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={tool === 'text' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('text')}
            >
              <Type className="h-4 w-4 mr-1" />
              Text
            </Button>
            <Button
              variant={tool === 'image' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('image')}
            >
              <ImageIcon className="h-4 w-4 mr-1" />
              Image
            </Button>
            <Button
              variant={tool === 'panel' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('panel')}
            >
              <Square className="h-4 w-4 mr-1" />
              Panel
            </Button>
          </div>
          
          {/* Panel Actions */}
          <div className="mt-4 space-y-2">
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={addNewPanel}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Panel
            </Button>
            
            {selectedElement?.type === 'panel' && (
              <Button
                size="sm"
                variant="outline"
                className="w-full hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50"
                onClick={deleteSelectedPanel}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Panel
              </Button>
            )}
            <Button
              variant={tool === 'bubble' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('bubble')}
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              Bubble
            </Button>
          </div>
        </div>

        {/* Panel Layouts */}
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-sm font-semibold mb-3 text-gray-300">Professional Layouts</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {PANEL_LAYOUTS.map((layout) => (
              <Button
                key={layout.name}
                variant="outline"
                size="sm"
                className="w-full justify-start text-left p-2 h-auto"
                onClick={() => applyLayout(layout)}
              >
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2 mb-1">
                    <Grid3X3 className="h-4 w-4" />
                    <span className="font-medium">{layout.name}</span>
                  </div>
                  <span className="text-xs text-gray-400">{layout.description}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>


        {/* Element Properties */}
        {selectedElement && (
          <div className="p-4 flex-1 overflow-y-auto">
            <h3 className="text-sm font-semibold mb-3 text-gray-300">Properties</h3>
            <div className="space-y-3">
              {(selectedElement.type === 'text' || selectedElement.type === 'bubble') && (
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Text</label>
                  <Input
                    value={selectedElement.content || ''}
                    onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                    className="text-sm"
                  />
                </div>
              )}
              
              <div>
                <label className="text-xs text-gray-400 block mb-1">Font Size</label>
                <Slider
                  value={[selectedElement.fontSize || 16]}
                  onValueChange={([value]) => updateElement(selectedElement.id, { fontSize: value })}
                  min={8}
                  max={72}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Color</label>
                <input
                  type="color"
                  value={selectedElement.color || '#000000'}
                  onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                  className="w-full h-8 rounded border border-gray-600"
                />
              </div>

              {selectedElement.type !== 'text' && (
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Background</label>
                  <input
                    type="color"
                    value={selectedElement.backgroundColor || '#ffffff'}
                    onChange={(e) => updateElement(selectedElement.id, { backgroundColor: e.target.value })}
                    className="w-full h-8 rounded border border-gray-600"
                  />
                </div>
              )}

              {selectedElement.type === 'image' && (
                <Button onClick={insertImage} className="w-full" variant="outline">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => deleteElement(selectedElement.id)}
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                {selectedElement.type === 'image' && (
                  <Button
                    onClick={insertImage}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Replace
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Canvas */}
      <main className="flex-1 flex flex-col">
        <div className="border-b border-gray-700 bg-gray-800/50 p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-300">
              {selectedPage?.title || 'No page selected'}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={addQuickText}>
                <Type className="h-4 w-4 mr-1" />
                Add Text
              </Button>
              <Button variant="outline" size="sm" onClick={addQuickImage}>
                <ImageIcon className="h-4 w-4 mr-1" />
                Add Photo
              </Button>
              <Button variant="outline" size="sm" onClick={addImageToAllPanels}>
                <ImageIcon className="h-4 w-4 mr-1" />
                Fill All Panels
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportPage()}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="default" size="sm" onClick={() => setPublishOpen(true)}>
                Publish
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 bg-gray-100">
          {selectedPage && (
            <div
              ref={canvasRef}
              className="relative mx-auto bg-white rounded-lg shadow-lg overflow-hidden"
              style={{
                width: '800px', 
                height: '1100px', 
                transform: `scale(1)`,
                transformOrigin: 'top left'
              }}
              onClick={handleCanvasClick}
              onContextMenu={handleCanvasClick}
              data-page={project.pages?.indexOf(selectedPage) || 0}
            >
              {/* Grid overlay */}
              {false && (
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, #ccc 1px, transparent 1px),
                      linear-gradient(to bottom, #ccc 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px'
                  }}
                />
              )}
              
              {/* Elements */}
              {selectedPage.elements
                .sort((a, b) => a.zIndex - b.zIndex)
                .map((element) => (
                  <div
                    key={element.id}
                    className={clsx(
                      "absolute cursor-move border-2",
                      selectedElementId === element.id ? "border-blue-500" : "border-transparent"
                    )}
                    style={{
                      left: element.x,
                      top: element.y,
                      width: element.width,
                      height: element.height,
                      transform: `rotate(${element.rotation || 0}deg)`,
                      zIndex: element.zIndex
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (element.type === 'panel') {
                        handlePanelClick(e, element.id);
                      } else {
                        setSelectedElementId(element.id);
                      }
                    }}
                  >
                    {element.type === 'text' && (
                      <div
                        contentEditable={selectedElementId === element.id}
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          if (selectedElementId === element.id) {
                            updateElement(element.id, { content: e.currentTarget.textContent || '' });
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            e.currentTarget.blur();
                          }
                        }}
                        style={{
                          fontSize: element.fontSize,
                          fontFamily: element.fontFamily,
                          color: element.color,
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '4px',
                          outline: selectedElementId === element.id ? '2px dashed #3b82f6' : 'none',
                          cursor: selectedElementId === element.id ? 'text' : 'pointer'
                        }}
                      >
                        {element.content || 'Double-click to edit'}
                      </div>
                    )}
                    
                    {element.type === 'image' && element.imageUrl && (
                      <div className="relative group w-full h-full">
                        <img
                          src={element.imageUrl}
                          alt="Comic element"
                          className="w-full h-full object-cover rounded"
                          style={{
                            objectFit: 'cover',
                            objectPosition: 'center'
                          }}
                          draggable={false}
                        />
                        {selectedElementId === element.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteElement(element.id);
                            }}
                            className="absolute top-1 right-1 rounded-full bg-red-600 text-white p-1 opacity-0 group-hover:opacity-100 hover:bg-red-700 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                    
                    {element.type === 'image' && !element.imageUrl && (
                      <div className="w-full h-full bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                          <div className="text-sm">Click to add image</div>
                        </div>
                      </div>
                    )}
                    
                    {element.type === 'bubble' && (
                      <div
                        className="relative w-full h-full rounded-lg flex items-center justify-center p-2"
                        style={{
                          backgroundColor: element.backgroundColor,
                          border: `${element.borderWidth}px solid ${element.borderColor}`
                        }}
                      >
                        <div
                          contentEditable={selectedElementId === element.id}
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            if (selectedElementId === element.id) {
                              updateElement(element.id, { content: e.currentTarget.textContent || '' });
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              e.currentTarget.blur();
                            }
                          }}
                          style={{
                            fontSize: element.fontSize,
                            fontFamily: element.fontFamily,
                            color: element.color,
                            textAlign: 'center',
                            outline: selectedElementId === element.id ? '2px dashed #3b82f6' : 'none',
                            cursor: selectedElementId === element.id ? 'text' : 'pointer',
                            minHeight: '20px',
                            width: '100%'
                          }}
                        >
                          {element.content || 'Double-click to edit'}
                        </div>
                        {/* Speech bubble tail */}
                        <div
                          className="absolute w-0 h-0"
                          style={{
                            left: element.tailX,
                            top: element.tailY,
                            borderLeft: '10px solid transparent',
                            borderRight: '10px solid transparent',
                            borderTop: `15px solid ${element.backgroundColor}`,
                            transform: 'translateX(-50%)'
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
          
          {/* Context Menu for Panels */}
          {contextMenu && (
            <div
              className="absolute bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 p-2 min-w-[120px]"
              style={{
                left: contextMenu.x,
                top: contextMenu.y,
                transform: 'translate(-50%, -10px)'
              }}
            >
              <div className="text-xs text-gray-400 mb-2 px-2">Add to Panel:</div>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-gray-700 rounded transition-colors"
                onClick={() => addToPanel(contextMenu.panelId, 'text')}
              >
                <Type className="h-4 w-4" />
                Add Text
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-gray-700 rounded transition-colors"
                onClick={() => addToPanel(contextMenu.panelId, 'image')}
              >
                <ImageIcon className="h-4 w-4" />
                Add Photo
              </button>
              <div className="border-t border-gray-600 my-1"></div>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:bg-gray-700 rounded transition-colors"
                onClick={() => setContextMenu(null)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  </>
  );
}
