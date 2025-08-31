import { useState, useEffect } from "react";
import { useStoryProjects, useCreateStoryProject, useUpdateStoryProject, useDeleteStoryProject, useComicProjects, useCreateComicProject, useUpdateComicProject, useDeleteComicProject, usePhotoProjects, useCreatePhotoProject, useUpdatePhotoProject, useDeletePhotoProject } from '@/hooks/useTaleCraft';
import { Helmet } from "react-helmet";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import StoryEditor from "@/components/talecraft/StoryEditor";
import ComicEditor from "@/components/talecraft/ComicEditor";
import CoverDesigner from "@/components/talecraft/CoverDesigner";
import PublishModal from "@/components/talecraft/PublishModal";
import { 
  BookOpen, 
  Image as ImageIcon, 
  Book,
  Palette, 
  Download, 
  User, 
  Plus,
  FileText,
  Eye,
  Heart,
  Star,
  Hammer,
  Sparkles,
  Trash2,
  X,
  Upload
} from "lucide-react";
import clsx from "clsx";
import { useGeneralFileUpload } from "@/hooks/useFileUpload";
import { attemptDownload } from "@/lib/downloadGate";
import { exportProject } from "@/lib/exportProject";
import { useRoles } from "@/hooks/useRoles";
import { type TaleCraftPublish, PUBLISH_PAGES } from "@shared/schema";

interface StoryProject {
  id: string;
  title: string;
  chapters: Array<{
    id: string;
    title: string;
    pages: Array<{
      id: string;
      title: string;
      content: string;
      wordCount: number;
    }>;
    wordCount: number;
  }>;
  lastModified: Date;
}

interface ComicProject {
  id: string;
  title: string;
  pages: Array<{
    id: string;
    title: string;
    elements: any[];
    backgroundColor: string;
  }>;
  lastModified: Date;
}

// New Photo Story template types
interface PhotoPage {
  id: string;
  photoUrl: string;
  caption: string;
}

interface PhotoProject {
  id: string;
  title: string;
  pages: PhotoPage[];
  lastModified: Date;
}

interface UserProfile {
  name: string;
  projects: number;
  drafts: number;
  published: number;
  views: number;
  likes: number;
}


export default function TalesCraftPage() {
  // Load drafts from localStorage on mount
  useEffect(() => {
    try {
      const savedStory = localStorage.getItem('tc_draft_story');
      if (savedStory && !currentStoryProject) {
        setCurrentStoryProject(JSON.parse(savedStory));
      }
      const savedComic = localStorage.getItem('tc_draft_comic');
      if (savedComic && !currentComicProject) {
        setCurrentComicProject(JSON.parse(savedComic));
      }
      const savedPhoto = localStorage.getItem('tc_draft_photo');
      if (savedPhoto && !currentPhotoProject) {
        setCurrentPhotoProject(JSON.parse(savedPhoto));
      }
    } catch (e) {
      console.warn('Failed to restore draft', e);
    }
  }, []);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'story' | 'comic' | 'photo' | 'cover' | 'export' | 'profile'>('dashboard');
  const { data: storyProjects = [], isLoading: storyLoading } = useStoryProjects();
  const createStoryProjectMut = useCreateStoryProject();
  const updateStoryProjectMut = useUpdateStoryProject();
  const deleteStoryProjectMut = useDeleteStoryProject();
  const { data: comicProjects = [], isLoading: comicLoading } = useComicProjects();
  const createComicProjectMut = useCreateComicProject();
  const updateComicProjectMut = useUpdateComicProject();
  const deleteComicProjectMut = useDeleteComicProject();
  const [currentStoryProject, setCurrentStoryProject] = useState<StoryProject | null>(null);
  const [currentComicProject, setCurrentComicProject] = useState<ComicProject | null>(null);
  const { data: photoProjects = [], isLoading: photoLoading } = usePhotoProjects();
  const createPhotoProjectMut = useCreatePhotoProject();
  const updatePhotoProjectMut = useUpdatePhotoProject();
  const deletePhotoProjectMut = useDeletePhotoProject();
  const [currentPhotoProject, setCurrentPhotoProject] = useState<PhotoProject | null>(null);
  const [currentPhotoPageIdx, setCurrentPhotoPageIdx] = useState<number>(0);
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [photoText, setPhotoText] = useState<string>("");

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
    if (!resp.ok) {
      throw new Error('Image upload failed');
    }
    const json = await resp.json();
    return json.url as string;
  };

  const [isPhotoUploading, setIsPhotoUploading] = useState(false);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsPhotoUploading(true);
    try {
      const url = await uploadPhotoImage(file);
      console.log('Photo uploaded successfully:', url);
      setPhotoUrl(url);
      if (currentPhotoProject) {
        const updated = { ...currentPhotoProject };
        updated.pages[0].photoUrl = url;
        updated.lastModified = new Date();
        setCurrentPhotoProject(updated);
        updatePhotoProjectMut.mutate({ id: updated.id, data: updated });
      }
    } catch (error) {
      console.error('Photo upload failed:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setIsPhotoUploading(false);
    }
  };

  const [projectToDelete, setProjectToDelete] = useState<{id: string, type: 'story' | 'comic' | 'photo', title: string} | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [publishModal, setPublishModal] = useState<{
    isOpen: boolean;
    projectType: 'story' | 'comic';
    projectTitle: string;
    projectContent: string;
  }>({ isOpen: false, projectType: 'story', projectTitle: '', projectContent: '' });
  const roles = useRoles();
  const allowedPages = roles.isAdmin ? PUBLISH_PAGES : PUBLISH_PAGES.filter(p => p !== "hekayaty_original");

  const [userProfile] = useState<UserProfile>({
    name: "Demo Creator",
    projects: 3,
    drafts: 2,
    published: 1,
    views: 1247,
    likes: 89
  });

  // Migration function for old project structure
  const migrateStoryProject = (project: any): StoryProject => {
    // If project already has the new structure, return as is
    if (project.chapters && project.chapters[0]?.pages) {
      return {
        ...project,
        lastModified: new Date(project.lastModified)
      };
    }
    
    // Migrate old structure to new structure
    const migratedChapters = project.chapters?.map((chapter: any) => {
      if (chapter.pages) {
        return chapter; // Already migrated
      }
      
      // Convert old chapter with content to new chapter with pages
      return {
        id: chapter.id,
        title: chapter.title,
        pages: [{
          id: crypto.randomUUID(),
          title: "Page 1",
          content: chapter.content || "",
          wordCount: chapter.wordCount || 0
        }],
        wordCount: chapter.wordCount || 0
      };
    }) || [];
    
    return {
      ...project,
      chapters: migratedChapters,
      lastModified: new Date(project.lastModified)
    };
  };


  
  const createNewStoryProject = async () => {
    // Optimistic UI: create local project and open editor immediately
    const tempProjectId = crypto.randomUUID();
    const newPage = {
      id: crypto.randomUUID(),
      title: "Page 1",
      content: "",
      wordCount: 0
    };
    
    const newProject: StoryProject = {
      id: tempProjectId,
      title: "Untitled Story",
      chapters: [{
        id: crypto.randomUUID(),
        title: "Chapter 1",
        pages: [newPage],
        wordCount: 0
      }],
      lastModified: new Date()
    };
    
    // Open editor right away with local id
    setCurrentStoryProject(newProject);
    setActiveTab('story');

    try {
      const res = await createStoryProjectMut.mutateAsync({ title: newProject.title });
      // Update id after backend responds
      setCurrentStoryProject((prev) => prev && prev.id === tempProjectId ? { ...prev, id: res.id } : prev as any);
    } catch (err) {
      console.error('Failed to create story project', err);
    }
  };

  const createNewPhotoProject = async () => {
    const tempId = crypto.randomUUID();
    const newProject: PhotoProject = {
      id: tempId,
      title: 'Untitled Photo Story',
      pages: [{ id: crypto.randomUUID(), photoUrl: '', caption: '' }],
      lastModified: new Date()
    };
    // optimistic open
    setCurrentPhotoProject(newProject);
    setCurrentPhotoPageIdx(0);
    setPhotoUrl('');
    setPhotoText('');
    setActiveTab('photo');
    try {
      const createRes = await createPhotoProjectMut.mutateAsync({ title: newProject.title });
      setCurrentPhotoProject((prev)=> prev && prev.id===tempId? {...prev, id: createRes.id}:prev);
    } catch(e){ console.error('Failed to create photo',e);}
  };

  const createNewComicProject = async () => {
    const tempId = crypto.randomUUID();
    const newProject: ComicProject = {
      id: tempId,
      title: "Untitled Comic",
      pages: [{
        id: crypto.randomUUID(),
        title: "Page 1",
        elements: [],
        backgroundColor: '#ffffff'
      }],
      lastModified: new Date()
    };
    
    setCurrentComicProject(newProject);
    setActiveTab('comic');
    try {
      const res = await createComicProjectMut.mutateAsync({ title: newProject.title });
      setCurrentComicProject((prev)=> prev && prev.id===tempId? {...prev, id: res.id}:prev);
    } catch(e){ console.error('Failed to create comic',e);}
  };

  const updateStoryProject = (updatedProject: StoryProject) => {
  // autosave
  try { localStorage.setItem('tc_draft_story', JSON.stringify(updatedProject)); } catch {}

    updateStoryProjectMut.mutate({ id: updatedProject.id, data: updatedProject });
    setCurrentStoryProject(updatedProject);
  };

  const updateComicProject = (updatedProject: ComicProject) => {
  try { localStorage.setItem('tc_draft_comic', JSON.stringify(updatedProject)); } catch {}

    updateComicProjectMut.mutate({ id: updatedProject.id, data: updatedProject });
    setCurrentComicProject(updatedProject);
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    const { id, type, title } = projectToDelete;

    try {
      if (type === 'story') {
        await deleteStoryProjectMut.mutateAsync(id);
        if (currentStoryProject?.id === id) {
          setCurrentStoryProject(null);
        }
      } else if (type === 'comic') {
        await deleteComicProjectMut.mutateAsync(id);
        if (currentComicProject?.id === id) {
          setCurrentComicProject(null);
        }
      } else {
        await deletePhotoProjectMut.mutateAsync(id);
        if (currentPhotoProject?.id === id) {
          setCurrentPhotoProject(null);
        }
      }
      toast.success(`"${title}" has been deleted`);
    } catch (error: any) {
      console.error('Delete project failed', error);
      toast.error(error?.message || 'Failed to delete project');
    } finally {
      setProjectToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const confirmDelete = (id: string, type: 'story' | 'comic' | 'photo', title: string) => {
    setProjectToDelete({ id, type, title });
    setIsDeleteDialogOpen(true);
  };

  const openStoryProject = (project: StoryProject) => {
    setCurrentStoryProject(project);
    setActiveTab('story');
  };

  const openComicProject = (project: ComicProject) => {
    setCurrentComicProject(project);
    setActiveTab('comic');
  };

  const openPublishModal = (projectType: 'story' | 'comic', project: StoryProject | ComicProject) => {
    let content = '';
    
    if (projectType === 'story') {
      const storyProject = project as StoryProject;
      content = storyProject.chapters.map(chapter => 
        chapter.pages.map(page => page.content).join('\n\n')
      ).join('\n\n---\n\n');
    } else {
      const comicProject = project as ComicProject;
      content = `Comic with ${comicProject.pages.length} pages`;
    }
    
    setPublishModal({
      isOpen: true,
      projectType,
      projectTitle: project.title,
      projectContent: content
    });
  };

  const handlePublish = async (data: TaleCraftPublish) => {
    try {
      // Obtain current access token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      const response = await fetch('/api/talecraft/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errMsg = (await response.json()).message || 'Failed to publish';
        throw new Error(errMsg);
      }
      
      // Update user profile stats
      // This would normally come from the server
      toast.success(`${data.projectType === 'comic' ? 'Comic' : 'Story'} published successfully!`);
    } catch (error: any) {
      console.error('Publish error:', error);
      toast.error(error.message || 'Publish failed');
    }
  };

  const Dashboard = () => (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center py-12 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-amber-500/20 rounded-full">
            <Hammer className="h-8 w-8 text-amber-400" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Welcome to TalesCraft</h1>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Your creative workshop for crafting amazing stories, comics, and book covers. 
          Bring your imagination to life with our professional tools.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gray-800/50 border-gray-700 hover:border-emerald-500/50 transition-colors cursor-pointer group" onClick={createNewStoryProject}>
          <CardHeader className="text-center">
            <div className="mx-auto p-3 bg-emerald-500/20 rounded-full w-fit mb-3 group-hover:bg-emerald-500/30 transition-colors">
              <BookOpen className="h-6 w-6 text-emerald-400" />
            </div>
            <CardTitle className="text-white">Create Story</CardTitle>
            <CardDescription>Write your next masterpiece with our rich text editor</CardDescription>
          </CardHeader>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-colors cursor-pointer group" onClick={createNewComicProject}>
          <CardHeader className="text-center">
            <div className="mx-auto p-3 bg-purple-500/20 rounded-full w-fit mb-3 group-hover:bg-purple-500/30 transition-colors">
              <ImageIcon className="h-6 w-6 text-purple-400" />
            </div>
            <CardTitle className="text-white">Create Comic</CardTitle>
            <CardDescription>Design comics with panels, bubbles, and artwork</CardDescription>
          </CardHeader>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700 hover:border-blue-500/50 transition-colors cursor-pointer group" onClick={() => setActiveTab('cover')}>
          <CardHeader className="text-center">
            <div className="mx-auto p-3 bg-blue-500/20 rounded-full w-fit mb-3 group-hover:bg-blue-500/30 transition-colors">
              <Palette className="h-6 w-6 text-blue-400" />
            </div>
            <CardTitle className="text-white">Design Cover</CardTitle>
            <CardDescription>Create stunning book covers with templates</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Recent Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Story Projects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-emerald-400" />
              Story Projects
            </h2>
            <Button variant="outline" size="sm" onClick={createNewStoryProject}>
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
          <div className="space-y-3">
            {storyProjects.length === 0 ? (
              <Card className="bg-gray-800/30 border-gray-700">
                <CardContent className="p-6 text-center text-gray-400">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No story projects yet</p>
                  <p className="text-sm">Create your first story to get started</p>
                </CardContent>
              </Card>
            ) : (
              storyProjects.slice(0, 3).map((project) => (
                <div key={project.id} className="group relative">
                  <Card className="bg-gray-800/50 border-gray-700 hover:border-emerald-500/50 transition-colors cursor-pointer" onClick={() => openStoryProject(project as any)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-white truncate">{project.title}</h3>
                          <p className="text-sm text-gray-400">
                            {Array.isArray(project.chapters) ? project.chapters.length : 0} chapters • {Array.isArray(project.chapters) ? project.chapters.reduce((sum: number, ch: any) => sum + (ch.pages?.length || 0), 0) : 0} pages • {Array.isArray(project.chapters) ? project.chapters.reduce((sum: number, ch: any) => sum + (ch.wordCount || 0), 0) : 0} words
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Modified {new Date(project.lastModified).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300">
                          Story
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute -top-2 right-6 h-6 w-6 rounded-full bg-blue-500/90 hover:bg-blue-500 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPublishModal('story', project as any);
                    }}
                  >
                    <Upload className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500/90 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmDelete(project.id, 'story', project.title);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Comic Projects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-purple-400" />
              Comic Projects
            </h2>
            <Button variant="outline" size="sm" onClick={createNewComicProject}>
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
          <div className="space-y-3">
            {comicProjects.length === 0 ? (
              <Card className="bg-gray-800/30 border-gray-700">
                <CardContent className="p-6 text-center text-gray-400">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No comic projects yet</p>
                  <p className="text-sm">Create your first comic to get started</p>
                </CardContent>
              </Card>
            ) : (
              comicProjects.slice(0, 3).map((project) => (
                <div key={project.id} className="group relative">
                  <Card className="bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-colors cursor-pointer" onClick={() => openComicProject(project as any)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-white truncate">{project.title}</h3>
                          <p className="text-sm text-gray-400">
                            {project.pages.length} pages
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Modified {new Date(project.lastModified).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                          Comic
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute -top-2 right-6 h-6 w-6 rounded-full bg-blue-500/90 hover:bg-blue-500 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPublishModal('comic', project as any);
                    }}
                  >
                    <Upload className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500/90 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmDelete(project.id, 'comic', project.title);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const handleExport = async () => {
  try {
    if (activeTab === 'story' && currentStoryProject) {
      await exportProject({ type: 'story', project: currentStoryProject });
    } else if (activeTab === 'comic' && currentComicProject) {
      await exportProject({ type: 'comic', project: currentComicProject });
    } else if (activeTab === 'cover' && currentPhotoProject) {
      await exportProject({ type: 'photo', project: currentPhotoProject });
    }
    toast.success('ZIP exported');
  } catch (err:any) {
    console.error('Export failed', err);
    toast.error('Export failed');
  }
};

  const handlePDFExport = async () => {
  try {
    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;
    
    if (activeTab === 'comic' && currentComicProject) {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Get comic pages data
      const pages = currentComicProject.pages || [];
      
      for (let i = 0; i < pages.length; i++) {
        if (i > 0) pdf.addPage();
        
        // Find the canvas element for this page
        const pageElement = document.querySelector(`[data-page="${i}"]`) as HTMLElement;
        if (pageElement) {
          const canvas = await html2canvas(pageElement, {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true,
            allowTaint: true
          });
          
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageWidth - 20; // 10mm margin on each side
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          // Center the image on the page
          const x = 10;
          const y = (pageHeight - imgHeight) / 2;
          
          pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        }
      }
      
      // Add title page if no pages exist
      if (pages.length === 0) {
        pdf.setFontSize(24);
        pdf.text(currentComicProject.title || 'Untitled Comic', pageWidth / 2, 50, { align: 'center' });
        pdf.setFontSize(12);
        pdf.text('Created with TalesCraft', pageWidth / 2, 70, { align: 'center' });
      }
      
      pdf.save(`${currentComicProject.title || 'comic'}.pdf`);
      toast.success('PDF exported successfully!');
    } else {
      toast.error('Please select a comic project to export');
    }
  } catch (err: any) {
    console.error('PDF export failed', err);
    toast.error('PDF export failed');
  }
};

const ExportPanel = () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Export Your Creations</h2>
        <p className="text-gray-300">Transform your projects into shareable formats</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="text-center">
            <Download className="h-8 w-8 mx-auto mb-3 text-blue-400" />
            <CardTitle className="text-white">Export as PDF</CardTitle>
            <CardDescription>Professional PDF format for printing and sharing</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={handlePDFExport}>
              Generate PDF
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="text-center">
            <Eye className="h-8 w-8 mx-auto mb-3 text-green-400" />
            <CardTitle className="text-white">Web Story</CardTitle>
            <CardDescription>Interactive web version with responsive design</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => window.open('data:text/html,<h1>Your Story Preview</h1><p>This would be your formatted story...</p>', '_blank')}>
              Preview Web Story
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="text-center">
            <Sparkles className="h-8 w-8 mx-auto mb-3 text-amber-400" />
            <CardTitle className="text-white">Publish</CardTitle>
            <CardDescription>Share your work with the TalesCraft community</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={handleExport}>
              Export ZIP
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const ProfilePanel = () => (
    <div className="max-w-2xl mx-auto space-y-8">
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-amber-400" />
          </div>
          <CardTitle className="text-white text-2xl">{userProfile.name}</CardTitle>
          <CardDescription>Creative Writer & Artist</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white">{userProfile.projects}</div>
              <div className="text-sm text-gray-400">Projects</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">{userProfile.drafts}</div>
              <div className="text-sm text-gray-400">Drafts</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">{userProfile.published}</div>
              <div className="text-sm text-gray-400">Published</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">{userProfile.views}</div>
              <div className="text-sm text-gray-400">Views</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">{userProfile.likes}</div>
              <div className="text-sm text-gray-400">Likes</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-gray-300">Created new story project</span>
            <span className="text-gray-500 ml-auto">2 hours ago</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span className="text-gray-300">Designed book cover</span>
            <span className="text-gray-500 ml-auto">1 day ago</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
            <span className="text-gray-300">Published comic chapter</span>
            <span className="text-gray-500 ml-auto">3 days ago</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950">
      <Helmet>
        <title>TalesCraft - Creative Writing & Design Studio</title>
        <meta name="description" content="Professional tools for creating stories, comics, and book covers" />
      </Helmet>

      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="h-screen flex flex-col">
        <div className="border-b border-gray-700 bg-gray-900/50 px-4">
          <TabsList className="grid w-full grid-cols-7 max-w-4xl mx-auto bg-transparent">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-100">
              <Hammer className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="story" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-100">
              <BookOpen className="h-4 w-4 mr-2" />
              Story
            </TabsTrigger>
            <TabsTrigger value="comic" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-100">
              <ImageIcon className="h-4 w-4 mr-2" />
              Comic
            </TabsTrigger>
            <TabsTrigger value="photo" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-100">
              <Book className="h-4 w-4 mr-2" />
              Photo
            </TabsTrigger>
            <TabsTrigger value="cover" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-100">
              <Palette className="h-4 w-4 mr-2" />
              Cover
            </TabsTrigger>
            <TabsTrigger value="export" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-100">
              <Download className="h-4 w-4 mr-2" />
              Export
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-gray-500/20 data-[state=active]:text-gray-100">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="dashboard" className="h-full p-6 overflow-y-auto">
            <Dashboard />
          </TabsContent>

          <TabsContent value="story" className="h-full">
            {currentStoryProject ? (
              <StoryEditor 
                project={currentStoryProject} 
                onProjectUpdate={updateStoryProject}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Story Project Open</h3>
                  <p className="text-gray-400 mb-4">Create a new story or open an existing one to start writing</p>
                  <Button onClick={createNewStoryProject}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Story
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="comic" className="h-full">
            {currentComicProject ? (
              <ComicEditor 
                project={currentComicProject} 
                onProjectUpdate={updateComicProject}
                onPublish={() => openPublishModal('comic', currentComicProject)}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <ImageIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Comic Project Open</h3>
                  <p className="text-gray-400 mb-4">Create a new comic or open an existing one to start designing</p>
                  <Button onClick={createNewComicProject}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Comic
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="photo" className="h-full p-6 overflow-y-auto">
            {currentPhotoProject ? (
              <div className="space-y-4 max-w-2xl mx-auto">
                {/* Image upload or preview */}
                {!photoUrl ? (
                  <label className="flex items-center gap-2 cursor-pointer text-teal-300 hover:text-teal-200">
                    <Upload className="h-5 w-5" />
                    <span>{isPhotoUploading ? 'Uploading...' : 'Upload an image'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} disabled={isPhotoUploading} />
                  </label>
                ) : (
                  <img src={photoUrl} alt="Uploaded" className="max-h-80 mx-auto rounded-md" />
                )}

                {/* Story text area */}
                <textarea
                  className="w-full min-h-[180px] bg-gray-800 border border-gray-700 rounded-md p-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Write your story here..."
                  value={photoText}
                  onChange={(e) => {
                    const text = e.target.value;
                    setPhotoText(text);
                    if (currentPhotoProject) {
                      const updated = { ...currentPhotoProject };
                      updated.pages[0].caption = text;
                      updated.lastModified = new Date();
                      setCurrentPhotoProject(updated);
                      updatePhotoProjectMut.mutate({ id: updated.id, data: updated });
                    }
                  }}
                />

                {/* Live preview */}
                {photoUrl && photoText && (
                  <div className="border-t border-gray-700 pt-6 space-y-4">
                    <img src={photoUrl} alt="Preview" className="max-h-80 mx-auto rounded-md" />
                    <p className="whitespace-pre-wrap text-gray-200 leading-relaxed">{photoText}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <ImageIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Photo Story Project Open</h3>
                  <p className="text-gray-400 mb-4">Create a new Photo Storybook to start crafting your tale</p>
                  <Button onClick={createNewPhotoProject}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Photo Story
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="cover" className="h-full">
            <CoverDesigner />
          </TabsContent>

          <TabsContent value="export" className="h-full p-6 overflow-y-auto">
            <ExportPanel />
          </TabsContent>

          <TabsContent value="profile" className="h-full p-6 overflow-y-auto">
            <ProfilePanel />
          </TabsContent>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="bg-gray-800 border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Delete Project</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                Are you sure you want to delete "{projectToDelete?.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-gray-600 hover:bg-gray-700">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                className="bg-red-600 hover:bg-red-700"
                onClick={handleDeleteProject}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <PublishModal
          isOpen={publishModal.isOpen}
          onClose={() => setPublishModal(prev => ({ ...prev, isOpen: false }))}
          projectType={publishModal.projectType}
          projectTitle={publishModal.projectTitle}
          projectContent={publishModal.projectContent}
          onPublish={handlePublish}
          userIsAdmin={roles.isAdmin}
          allowedPages={allowedPages}
        />
      </Tabs>
    </div>
  );
}
