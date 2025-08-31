import { useEffect, useState, useCallback } from "react";
import { DndContext, useSensor, useSensors, PointerSensor, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
// using browser-native UUID generator
import { Helmet } from "react-helmet";
import clsx from "clsx";
import { useGeneralFileUpload } from "@/hooks/useFileUpload";
import { supabase } from "@/lib/supabase";
import { Trash2, X, ImageIcon } from "lucide-react";

interface Chapter {
  id: string;
  title: string;
  content: string;
}

type Tab = "story" | "comic" | "photo" | "cover" | "export" | "profile";

const LOCAL_KEY = "talecraft_project_v1";
const COMIC_LOCAL_KEY = "talecraft_comic_project_v1";

export default function TaleCraftEditorPage() {
  const [tab, setTab] = useState<Tab>("story");
  // photo story state
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [photoText, setPhotoText] = useState<string>("");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  // --- comic editor state ---
  const [comicPages, setComicPages] = useState<any[]>([]);
  const [selectedPage, setSelectedPage] = useState<number>(0);
  const [comicTemplate, setComicTemplate] = useState<string>("western");
  const [selectedPanel, setSelectedPanel] = useState<number | null>(null);
  const [drawingMode, setDrawingMode] = useState<string>("select");
  const [brushSize, setBrushSize] = useState<number>(5);
  const [brushColor, setBrushColor] = useState<string>("#000000");

  // --- localStorage persistence ---
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.chapters) setChapters(parsed.chapters);
        if (parsed.selectedId) setSelectedId(parsed.selectedId);
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      LOCAL_KEY,
      JSON.stringify({ chapters, selectedId })
    );
  }, [chapters, selectedId]);

  // --- Comic auto-save persistence ---
  useEffect(() => {
    const savedComic = localStorage.getItem(COMIC_LOCAL_KEY);
    if (savedComic) {
      try {
        const parsed = JSON.parse(savedComic);
        if (parsed.comicPages && parsed.comicPages.length > 0) {
          setComicPages(parsed.comicPages);
          setSelectedPage(parsed.selectedPage || 0);
          setComicTemplate(parsed.comicTemplate || "western");
        }
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    if (comicPages.length > 0) {
      localStorage.setItem(
        COMIC_LOCAL_KEY,
        JSON.stringify({ 
          comicPages, 
          selectedPage, 
          comicTemplate,
          lastSaved: new Date().toISOString()
        })
      );
    }
  }, [comicPages, selectedPage, comicTemplate]);

  // --- dnd-kit sensors ---
  const sensors = useSensors(useSensor(PointerSensor));

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = chapters.findIndex((c) => c.id === active.id);
    const newIndex = chapters.findIndex((c) => c.id === over.id);
    setChapters((prev) => arrayMove(prev, oldIndex, newIndex));
  };

  // --- chapter helpers ---
  const addChapter = () => {
    const newChap: Chapter = {
      id: crypto.randomUUID(),
      title: `Chapter ${chapters.length + 1}`,
      content: "",
    };
    setChapters((prev) => [...prev, newChap]);
    setSelectedId(newChap.id);
  };

  const updateChapter = (fields: Partial<Chapter>) => {
    if (!selectedId) return;
    setChapters((prev) =>
      prev.map((c) => (c.id === selectedId ? { ...c, ...fields } : c))
    );
  };

  const current = chapters.find((c) => c.id === selectedId) ?? null;

  // --- rich-text editing using contentEditable ---
  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  // Remove selected image from rich text editor
  const removeSelectedImage = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      
      // Find the image element
      let imgElement: HTMLImageElement | null = null;
      if (container.nodeType === Node.ELEMENT_NODE) {
        const element = container as Element;
        imgElement = element.querySelector('img') || (element.tagName === 'IMG' ? element as HTMLImageElement : null);
      } else if (container.parentElement) {
        imgElement = container.parentElement.querySelector('img');
      }
      
      if (imgElement) {
        imgElement.remove();
        // Update chapter content
        const editorElement = document.getElementById('content-editor');
        if (editorElement && current) {
          updateChapter({ content: editorElement.innerHTML });
        }
      }
    }
  };

  const StoryEditor = (
    <div className="flex flex-col md:flex-row h-full">
      {/* Sidebar */}
      <aside className="w-full md:w-56 shrink-0 border-r border-gray-600 p-4 overflow-y-auto bg-gray-900/40">
        <button
          onClick={addChapter}
          className="w-full mb-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 rounded text-white"
        >
          + New Chapter
        </button>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={chapters.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            {chapters.map((chapter) => (
              <div
                key={chapter.id}
                onClick={() => setSelectedId(chapter.id)}
                className={clsx(
                  "cursor-pointer p-2 rounded mb-2 text-sm truncate",
                  selectedId === chapter.id
                    ? "bg-emerald-700 text-white"
                    : "bg-gray-700/40 text-gray-200 hover:bg-gray-600/60"
                )}
              >
                {chapter.title || "(untitled)"}
              </div>
            ))}
          </SortableContext>
        </DndContext>
      </aside>

      {/* Editor / Preview */}
      <section className="flex-1 flex flex-col h-full">
        {/* Toolbar */}
        {current && !preview && (
          <div className="flex gap-2 border-b border-gray-700 bg-gray-800 p-2 overflow-x-auto">
            <button onClick={() => exec("bold")} className="px-2 py-1 text-xs hover:bg-gray-700 rounded">
              B
            </button>
            <button onClick={() => exec("italic")} className="px-2 py-1 text-xs hover:bg-gray-700 rounded">
              I
            </button>
            <button onClick={() => exec("underline")} className="px-2 py-1 text-xs hover:bg-gray-700 rounded">
              U
            </button>
            <button onClick={() => exec("insertOrderedList")} className="px-2 py-1 text-xs hover:bg-gray-700 rounded">
              OL
            </button>
            <button onClick={() => exec("insertUnorderedList")} className="px-2 py-1 text-xs hover:bg-gray-700 rounded">
              UL
            </button>
            <label className="px-2 py-1 text-xs hover:bg-gray-700 rounded cursor-pointer" title="Insert image">
              <ImageIcon className="h-4 w-4" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
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
                      if (!resp.ok) throw new Error('Upload failed');
                      const json = await resp.json();
                      exec("insertImage", json.url);
                    } catch (error) {
                      console.error('Image upload failed:', error);
                      alert('Failed to upload image. Please try again.');
                    }
                  }
                }}
              />
            </label>
            <button 
              onClick={removeSelectedImage} 
              className="px-2 py-1 text-xs hover:bg-red-700 rounded text-red-400 hover:text-white"
              title="Remove selected image"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button className="ml-auto text-xs" onClick={() => setPreview((p) => !p)}>
              {preview ? "Edit" : "Preview"}
            </button>
          </div>
        )}

        {/* Title input */}
        {current && !preview && (
          <input
            value={current.title}
            onChange={(e) => updateChapter({ title: e.target.value })}
            placeholder="Chapter title"
            className="w-full px-4 py-2 text-2xl font-semibold bg-transparent border-b border-gray-700 focus:outline-none"
          />
        )}

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-4 prose dark:prose-invert max-w-none bg-gray-900/20">
          {current ? (
            preview ? (
              <article dangerouslySetInnerHTML={{ __html: current.content }} />
            ) : (
              <div
                contentEditable
                suppressContentEditableWarning
                id="content-editor"
                className="flex-1 p-4 bg-gray-800/50 text-gray-100 resize-none focus:outline-none overflow-y-auto"
                onInput={(e) => updateChapter({ content: (e.target as HTMLElement).innerHTML })}
                dangerouslySetInnerHTML={{ __html: current.content }}
              />
            )
          ) : (
            <p className="text-gray-400">Select or create a chapter to begin.</p>
          )}
        </div>
      </section>
    </div>
  );

  const addComicPage = useCallback(() => {
    const templates = {
      western: [
        { id: 1, x: 10, y: 10, width: 280, height: 180, content: "", bubbles: [] },
        { id: 2, x: 300, y: 10, width: 280, height: 180, content: "", bubbles: [] },
        { id: 3, x: 10, y: 200, width: 570, height: 200, content: "", bubbles: [] }
      ],
      manga: [
        { id: 1, x: 10, y: 10, width: 570, height: 120, content: "", bubbles: [] },
        { id: 2, x: 10, y: 140, width: 180, height: 130, content: "", bubbles: [] },
        { id: 3, x: 200, y: 140, width: 180, height: 130, content: "", bubbles: [] },
        { id: 4, x: 390, y: 140, width: 190, height: 130, content: "", bubbles: [] },
        { id: 5, x: 10, y: 280, width: 570, height: 120, content: "", bubbles: [] }
      ],
      webcomic: [
        { id: 1, x: 10, y: 10, width: 570, height: 390, content: "", bubbles: [] }
      ],
      grid: [
        { id: 1, x: 10, y: 10, width: 275, height: 185, content: "", bubbles: [] },
        { id: 2, x: 295, y: 10, width: 275, height: 185, content: "", bubbles: [] },
        { id: 3, x: 10, y: 205, width: 275, height: 185, content: "", bubbles: [] },
        { id: 4, x: 295, y: 205, width: 275, height: 185, content: "", bubbles: [] }
      ]
    };

    const newPage = {
      id: Date.now(),
      panels: templates[comicTemplate as keyof typeof templates] || templates.western,
      background: "#ffffff"
    };
    
    setComicPages(prev => [...prev, newPage]);
    setSelectedPage(comicPages.length);
  }, [comicTemplate, comicPages.length]);

  // Initialize comic with first page if empty
  useEffect(() => {
    if (comicPages.length === 0) {
      // Use setTimeout to avoid setState during render
      setTimeout(() => {
        addComicPage();
      }, 0);
    }
  }, [addComicPage, comicPages.length]);

  const deleteComicPage = (pageIndex: number) => {
    if (comicPages.length <= 1) {
      alert("Cannot delete the last page. A comic must have at least one page.");
      return;
    }
    
    if (confirm("Are you sure you want to delete this page?")) {
      setComicPages(prev => prev.filter((_, idx) => idx !== pageIndex));
      // Adjust selected page if necessary
      if (selectedPage >= pageIndex && selectedPage > 0) {
        setSelectedPage(selectedPage - 1);
      } else if (selectedPage >= comicPages.length - 1) {
        setSelectedPage(Math.max(0, comicPages.length - 2));
      }
    }
  };

  const clearAllComicPages = () => {
    if (confirm("Are you sure you want to delete all pages and start fresh? This cannot be undone.")) {
      setComicPages([]);
      setSelectedPage(0);
      // Clear saved data
      localStorage.removeItem(COMIC_LOCAL_KEY);
      // Re-initialize with a fresh page
      setTimeout(() => {
        addComicPage();
      }, 100);
    }
  };

  const saveComicProject = () => {
    if (comicPages.length === 0) {
      alert("No comic project to save.");
      return;
    }
    
    const projectData = {
      comicPages,
      selectedPage,
      comicTemplate,
      lastSaved: new Date().toISOString(),
      projectName: prompt("Enter project name:", `Comic Project ${Date.now()}`) || `Comic Project ${Date.now()}`
    };
    
    localStorage.setItem(COMIC_LOCAL_KEY, JSON.stringify(projectData));
    alert(`Comic project "${projectData.projectName}" saved successfully!`);
  };

  const loadComicProject = () => {
    const savedComic = localStorage.getItem(COMIC_LOCAL_KEY);
    if (savedComic) {
      try {
        const parsed = JSON.parse(savedComic);
        if (parsed.comicPages && parsed.comicPages.length > 0) {
          setComicPages(parsed.comicPages);
          setSelectedPage(parsed.selectedPage || 0);
          setComicTemplate(parsed.comicTemplate || "western");
          alert(`Loaded project: ${parsed.projectName || 'Unnamed Project'}\nLast saved: ${new Date(parsed.lastSaved).toLocaleString()}`);
        } else {
          alert("No saved comic project found.");
        }
      } catch {
        alert("Error loading comic project.");
      }
    } else {
      alert("No saved comic project found.");
    }
  };

  const addTextBubble = (panelId: number, x: number, y: number) => {
    if (!comicPages[selectedPage]) return;
    
    const newBubble = {
      id: Date.now(),
      x: x - 50,
      y: y - 25,
      width: 100,
      height: 50,
      text: "Text here",
      type: "speech" // speech, thought, narration
    };

    setComicPages(prev => prev.map((page, idx) => 
      idx === selectedPage ? {
        ...page,
        panels: page.panels.map((panel: any) => 
          panel.id === panelId ? {
            ...panel,
            bubbles: [...(panel.bubbles || []), newBubble]
          } : panel
        )
      } : page
    ));
  };

  const updateBubbleText = (panelId: number, bubbleId: number, text: string) => {
    setComicPages(prev => prev.map((page, idx) => 
      idx === selectedPage ? {
        ...page,
        panels: page.panels.map((panel: any) => 
          panel.id === panelId ? {
            ...panel,
            bubbles: panel.bubbles?.map((bubble: any) => 
              bubble.id === bubbleId ? { ...bubble, text } : bubble
            ) || []
          } : panel
        )
      } : page
    ));
  };

  const exportComicToPDF = async () => {
    try {
      // Check if comic has content
      const hasContent = comicPages.some(page => 
        page.panels.some((panel: any) => 
          panel.content || 
          (panel.bubbles && panel.bubbles.length > 0) ||
          panel.image
        )
      );
      
      if (!hasContent) {
        alert('Cannot export empty comic. Please add some content, images, or text to your comic pages first.');
        return;
      }

      // Dynamic import to avoid bundle size issues
      const html2canvas = await import('html2canvas');
      const jsPDF = await import('jspdf');
      
      const pdf = new jsPDF.jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      for (let i = 0; i < comicPages.length; i++) {
        if (i > 0) pdf.addPage();
        
        // Temporarily switch to the page we want to capture
        const originalPage = selectedPage;
        setSelectedPage(i);
        
        // Wait for render and images to load
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Find the comic canvas element
        const canvasElement = document.querySelector('.mx-auto.bg-white.shadow-lg') as HTMLElement;
        if (canvasElement) {
          const canvas = await html2canvas.default(canvasElement, {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true,
            allowTaint: true,
            foreignObjectRendering: true,
            logging: false,
            imageTimeout: 15000,
            onclone: (clonedDoc) => {
              // Ensure all images are loaded in the cloned document
              const images = clonedDoc.querySelectorAll('img');
              images.forEach((img: HTMLImageElement) => {
                img.crossOrigin = 'anonymous';
              });
            }
          });
          
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageWidth - 20; // 10mm margin on each side
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          // Center the image on the page
          const x = 10;
          const y = Math.max(10, (pageHeight - imgHeight) / 2);
          
          pdf.addImage(imgData, 'PNG', x, y, imgWidth, Math.min(imgHeight, pageHeight - 20));
        }
        
        // Restore original page
        setSelectedPage(originalPage);
      }
      
      // Save the PDF
      pdf.save(`comic-${Date.now()}.pdf`);
      alert('Comic exported to PDF successfully!');
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to export PDF. Please try again or check if all images are loaded properly.');
    }
  };

  const ComicEditor = (
    <div className="flex h-full">
      {/* Comic Toolbar */}
      <div className="w-64 bg-gray-900/50 border-r border-gray-700 p-4 overflow-y-auto">
        <div className="space-y-6">
          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Template</label>
            <select 
              value={comicTemplate} 
              onChange={(e) => setComicTemplate(e.target.value)}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
            >
              <option value="western">Western Comic</option>
              <option value="manga">Manga Style</option>
              <option value="webcomic">Webcomic</option>
              <option value="grid">4-Panel Grid</option>
            </select>
          </div>

          {/* Drawing Tools */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Tools</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["select", "🔍 Select"],
                ["pen", "✏️ Pen"],
                ["brush", "🖌️ Brush"],
                ["text", "💬 Text"],
                ["eraser", "🧽 Eraser"],
                ["fill", "🪣 Fill"]
              ].map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => setDrawingMode(mode)}
                  className={`p-2 text-xs rounded ${
                    drawingMode === mode 
                      ? "bg-emerald-600 text-white" 
                      : "bg-gray-700 hover:bg-gray-600 text-gray-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Brush Settings */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Brush Size</label>
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-full"
            />
            <span className="text-xs text-gray-400">{brushSize}px</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Color</label>
            <input
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              className="w-full h-10 rounded border border-gray-600"
            />
          </div>

          {/* Page Management */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Pages</label>
            <button
              onClick={addComicPage}
              className="w-full p-2 bg-emerald-600 hover:bg-emerald-700 rounded text-white text-sm mb-2"
            >
              + Add Page
            </button>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {comicPages.map((page, idx) => (
                <div key={page.id} className="flex gap-1">
                  <button
                    onClick={() => setSelectedPage(idx)}
                    className={`flex-1 p-2 text-left text-xs rounded ${
                      selectedPage === idx 
                        ? "bg-emerald-700 text-white" 
                        : "bg-gray-700 hover:bg-gray-600 text-gray-200"
                    }`}
                  >
                    Page {idx + 1}
                  </button>
                  <button
                    onClick={() => deleteComicPage(idx)}
                    className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-xs"
                    title="Delete page"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={clearAllComicPages}
              className="w-full p-2 bg-red-600 hover:bg-red-700 rounded text-white text-sm mt-2"
            >
              🗑️ Clear All Pages
            </button>
          </div>

          {/* Export Options */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Export</label>
            <div className="space-y-2">
              <button 
                onClick={exportComicToPDF}
                className="w-full p-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm"
              >
                📄 Export PDF
              </button>
              <button className="w-full p-2 bg-purple-600 hover:bg-purple-700 rounded text-white text-sm">
                🌐 Publish Online
              </button>
              <button 
                onClick={saveComicProject}
                className="w-full p-2 bg-green-600 hover:bg-green-700 rounded text-white text-sm"
              >
                💾 Save Project
              </button>
              <button 
                onClick={loadComicProject}
                className="w-full p-2 bg-yellow-600 hover:bg-yellow-700 rounded text-white text-sm"
              >
                📂 Load Project
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comic Canvas */}
      <div className="flex-1 bg-gray-100 overflow-auto p-4">
        {comicPages[selectedPage] && (
          <div className="mx-auto bg-white shadow-lg" style={{ width: "600px", height: "420px", position: "relative" }}>
            {/* Comic Page Background */}
            <div 
              className="w-full h-full relative border-2 border-gray-300"
              style={{ backgroundColor: comicPages[selectedPage].background }}
            >
              {/* Render Panels */}
              {comicPages[selectedPage].panels.map((panel: any) => (
                <div
                  key={panel.id}
                  className={`absolute border-2 cursor-pointer ${
                    selectedPanel === panel.id ? "border-emerald-500" : "border-gray-800"
                  }`}
                  style={{
                    left: panel.x,
                    top: panel.y,
                    width: panel.width,
                    height: panel.height,
                    backgroundColor: "#f9f9f9"
                  }}
                  onClick={() => setSelectedPanel(panel.id)}
                  onDoubleClick={(e) => {
                    if (drawingMode === "text") {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      addTextBubble(panel.id, x, y);
                    }
                  }}
                >
                  {/* Panel Content Area */}
                  <div className="w-full h-full p-2 text-xs text-gray-500 flex items-center justify-center">
                    {panel.content || "Double-click to add content"}
                  </div>

                  {/* Text Bubbles */}
                  {panel.bubbles?.map((bubble: any) => (
                    <div
                      key={bubble.id}
                      className="absolute bg-white border-2 border-gray-800 rounded-full p-2 text-xs cursor-move"
                      style={{
                        left: bubble.x,
                        top: bubble.y,
                        width: bubble.width,
                        height: bubble.height,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        const newText = prompt("Edit text:", bubble.text);
                        if (newText !== null) {
                          updateBubbleText(panel.id, bubble.id, newText);
                        }
                      }}
                    >
                      <span className="text-center leading-tight">{bubble.text}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-4 text-center text-gray-600 text-sm">
          <p>• Click panels to select • Double-click with text tool to add speech bubbles</p>
          <p>• Double-click bubbles to edit text • Use toolbar on left for drawing tools</p>
        </div>
      </div>
    </div>
  );

  // --- photo story maker ---
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const uploadPhotoImage = async (file: File): Promise<string> => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'photo-stories');

    const resp = await fetch('/api/upload/file', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!resp.ok) throw new Error('Upload failed');
    const json = await resp.json();
    return json.url as string;
  };

  // Delete photo function
  const deletePhoto = () => {
    setPhotoUrl("");
  };

  const PhotoStoryMaker = (
    <div className="p-6 flex flex-col gap-6 max-w-3xl mx-auto">
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-200">Upload Photo</label>
        {photoUrl ? (
          <div className="relative group">
            <img src={photoUrl} alt="story visual" className="w-full max-h-96 object-cover rounded" />
            <button
              onClick={deletePhoto}
              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              title="Delete photo"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-500 rounded p-8 text-center cursor-pointer hover:border-emerald-500" onClick={() => document.getElementById('photo-input')?.click()}>
            {uploadingPhoto ? "Uploading…" : "Click to upload"}
          </div>
        )}
        <input id="photo-input" type="file" accept="image/*" className="hidden" onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) {
            setUploadingPhoto(true);
            try {
              const url = await uploadPhotoImage(f);
              setPhotoUrl(url);
            } catch (error) {
              console.error('Photo upload failed:', error);
              alert('Failed to upload photo. Please try again.');
            } finally {
              setUploadingPhoto(false);
            }
          }
        }} />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-200">Story Text</label>
        <textarea
          className="w-full h-60 p-4 rounded bg-gray-800 text-gray-100 resize-y focus:outline-none"
          placeholder="Write your story here…"
          value={photoText}
          onChange={(e) => setPhotoText(e.target.value)}
        />
      </div>

      {photoUrl && (
        <div className="bg-amber-50/5 p-6 rounded shadow-inner space-y-4">
          <div className="relative group">
            <img src={photoUrl} alt="preview" className="w-full max-h-96 object-cover rounded" />
            <button
              onClick={deletePhoto}
              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              title="Delete photo"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <p className="whitespace-pre-wrap leading-relaxed font-cormorant text-lg text-amber-50/90">{photoText}</p>
        </div>
      )}
    </div>
  );

  // --- cover designer stub ---
  const [cover, setCover] = useState({
    title: "My Awesome Story",
    subtitle: "",
    bg: "#1e293b",
    image: "", // Add cover image support
  });

  // Upload cover image
  const [uploadingCover, setUploadingCover] = useState(false);
  
  const uploadCoverImage = async (file: File): Promise<string> => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'covers');

    const resp = await fetch('/api/upload/file', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!resp.ok) throw new Error('Upload failed');
    const json = await resp.json();
    return json.url as string;
  };

  // Delete cover image
  const deleteCoverImage = () => {
    setCover(prev => ({ ...prev, image: "" }));
  };

  const CoverDesigner = (
    <div className="flex flex-col md:flex-row gap-6 p-4">
      <div className="md:w-1/3 space-y-4">
        <input
          className="w-full p-2 rounded bg-gray-700 text-white"
          placeholder="Title"
          value={cover.title}
          onChange={(e) => setCover({ ...cover, title: e.target.value })}
        />
        <input
          className="w-full p-2 rounded bg-gray-700 text-white"
          placeholder="Subtitle / Author"
          value={cover.subtitle}
          onChange={(e) => setCover({ ...cover, subtitle: e.target.value })}
        />
        <input
          type="color"
          className="w-full h-10 p-1"
          value={cover.bg}
          onChange={(e) => setCover({ ...cover, bg: e.target.value })}
        />
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-200">Cover Image</label>
          {cover.image ? (
            <div className="relative group">
              <img src={cover.image} alt="Cover" className="w-full h-32 object-cover rounded" />
              <button
                onClick={deleteCoverImage}
                className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                title="Delete cover image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div 
              className="border-2 border-dashed border-gray-500 rounded p-4 text-center cursor-pointer hover:border-emerald-500 text-sm"
              onClick={() => document.getElementById('cover-input')?.click()}
            >
              {uploadingCover ? "Uploading..." : "Click to upload cover image"}
            </div>
          )}
          <input 
            id="cover-input" 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) {
                setUploadingCover(true);
                try {
                  const url = await uploadCoverImage(f);
                  setCover(prev => ({ ...prev, image: url }));
                } catch (error) {
                  console.error('Cover upload failed:', error);
                  alert('Failed to upload cover image. Please try again.');
                } finally {
                  setUploadingCover(false);
                }
              }
            }} 
          />
        </div>
      </div>
      <div className="flex-1 flex justify-center items-center">
        <div
          className="w-60 h-80 shadow-inner flex flex-col justify-center items-center text-center px-4 relative overflow-hidden"
          style={{ background: cover.bg }}
        >
          {cover.image && (
            <img 
              src={cover.image} 
              alt="Cover background" 
              className="absolute inset-0 w-full h-full object-cover opacity-50" 
            />
          )}
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white truncate max-w-full drop-shadow-lg">
              {cover.title}
            </h2>
            <p className="text-sm text-white/80 mt-2 drop-shadow">{cover.subtitle}</p>
          </div>
        </div>
      </div>
    </div>
  );

  // --- export stub ---
  const ExportPanel = (
    <div className="p-6 space-y-4 text-center text-gray-200">
      <button
        className="px-4 py-2 bg-emerald-600 rounded hover:bg-emerald-700"
        onClick={() => window.open("/preview.html", "_blank")}
      >
        Export as PDF (mock)
      </button>
      <button
        className="px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-700"
        onClick={() => window.open("data:text/html," + encodeURIComponent(current?.content || ""), "_blank")}
      >
        Export as Web Story
      </button>
      <button
        className="px-4 py-2 bg-yellow-600 rounded hover:bg-yellow-700"
        onClick={() => alert("Pretend publishing …")}
      >
        Publish (mock)
      </button>
    </div>
  );

  // --- profile stub ---
  const Profile = (
    <div className="p-6 text-gray-200 space-y-4 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold">Demo User</h2>
      <p>Total projects: 1</p>
      <p>Drafts: 1 • Published: 0 • Views: 123 • Likes: 45</p>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-gray-100">
      <Helmet>
        <title>TaleCraft Editor</title>
      </Helmet>
      {/* Tabs */}
      <nav className="flex gap-4 p-4 border-b border-gray-700 overflow-x-auto text-sm md:text-base">
        {[
          ["story", "✏️ Story"],
          ["photo", "🖼️ Photo Story"],
          ["comic", "🎨 Comic"],
          ["cover", "📘 Cover"],
          ["export", "📤 Export"],
          ["profile", "👤 Profile"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key as Tab)}
            className={clsx(
              "px-3 py-1 rounded",
              tab === key ? "bg-emerald-600 text-white" : "hover:bg-gray-700/50"
            )}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {tab === "story" && StoryEditor}
        {tab === "comic" && ComicEditor}
        {tab === "photo" && PhotoStoryMaker}
        {tab === "cover" && CoverDesigner}
        {tab === "export" && ExportPanel}
        {tab === "profile" && Profile}
      </div>
    </div>
  );
}
