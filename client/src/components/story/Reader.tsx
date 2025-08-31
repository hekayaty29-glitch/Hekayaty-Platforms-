import React, { useState, useEffect, useRef, useMemo } from "react";
import { ReaderSettings, ReaderPreferences } from "./ReaderSettings";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Bookmark, 
  Share2, 
  ChevronLeft, 
  ChevronRight, 
  Layers,
  BookMarked,
  Music,
  FileText,
  Eye,
  Download
} from "lucide-react";

interface ReaderProps {
  title: string;
  author: string;
  content: string;
  storyId?: number;
  onBookmark?: () => void;
  isBookmarked?: boolean;
  /** Optional background soundtrack URL for this story */
  audioUrl?: string;
}

export function Reader({ title, author, content, storyId, onBookmark, isBookmarked = false, audioUrl }: ReaderProps) {
  // Reader preferences with defaults
  const [preferences, setPreferences] = useState<ReaderPreferences>({
    fontSize: "md",
    fontFamily: "serif",
    theme: "light",
    viewMode: "scroll",
  });
  
  // Track current page for paginated view
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [readProgress, setReadProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Parse content into sections with chapter numbers
  const sections = useMemo(() => {
    if (!content) return [];
    
    const parts = content.split(/\n\n---\n\n/);
    return parts.map((part, index) => {
      const lines = part.trim().split('\n');
      const title = lines[0]?.replace(/^#\s*/, '') || `Chapter ${index + 1}`;
      const body = lines.slice(1).join('\n').trim();
      
      // Check for special chapter types
      const pdfMatch = body.match(/\[PDF_CHAPTER:(.+?)\]/);
      const audioMatch = body.match(/\[AUDIO_CHAPTER:(.+?)\]/);
      const imageMatch = body.match(/\[IMAGE_CHAPTER:(.+?)\]/);
      
      if (pdfMatch) {
        return { title, type: 'pdf', url: pdfMatch[1], body: '', chapterNumber: index + 1 };
      } else if (audioMatch) {
        return { title, type: 'audio', url: audioMatch[1], body: '', chapterNumber: index + 1 };
      } else if (imageMatch) {
        return { title, type: 'image', url: imageMatch[1], body: '', chapterNumber: index + 1 };
      } else {
        return { title, type: 'text', body, url: '', chapterNumber: index + 1 };
      }
    }).filter(section => section.title && (section.body || section.url));
  }, [content]);

  // Separate PDF chapters from text chapters
  const pdfChapters = sections.filter((section: any) => section.type === 'pdf');
  const textChapters = sections.filter((section: any) => section.type === 'text');
  const audioChapters = sections.filter((section: any) => section.type === 'audio');
  const imageChapters = sections.filter((section: any) => section.type === 'image');
  
  // Calculate pages for paginated view (approximately)
  useEffect(() => {
    if (preferences.viewMode === "paginated" && contentRef.current) {
      // Very simple page calculation - each "page" is about 500 words
      const wordsPerPage = 500; 
      const wordCount = content ? content.split(/\s+/).length : 0;
      const calculatedPages = Math.max(1, Math.ceil(wordCount / wordsPerPage));
      setTotalPages(calculatedPages);
      // Reset to page 1 when switching to paginated mode
      setCurrentPage(1);
    }
  }, [preferences.viewMode, content]);
  
  // Track reading progress
  useEffect(() => {
    const trackProgress = () => {
      if (contentRef.current && preferences.viewMode === "scroll") {
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        const contentTop = contentRef.current.offsetTop;
        const contentHeight = contentRef.current.scrollHeight;
        
        if (scrollTop >= contentTop) {
          const contentScrolled = scrollTop - contentTop;
          const progress = Math.min(100, Math.round((contentScrolled / (contentHeight - clientHeight)) * 100));
          setReadProgress(progress);
          
          // Save progress to localStorage with a unique key
          const progressKey = storyId ? `reading-progress-${storyId}` : `reading-progress-${title}`;
          localStorage.setItem(progressKey, progress.toString());
        }
      }
    };
    
    window.addEventListener("scroll", trackProgress);
    return () => window.removeEventListener("scroll", trackProgress);
  }, [preferences.viewMode, title, storyId]);
  
  // Load saved progress
  useEffect(() => {
    const progressKey = storyId ? `reading-progress-${storyId}` : `reading-progress-${title}`;
    const savedProgress = localStorage.getItem(progressKey);
    if (savedProgress) {
      setReadProgress(parseInt(savedProgress));
      if (preferences.viewMode === "paginated") {
        const progressPercent = parseInt(savedProgress);
        const pageFromProgress = Math.ceil((progressPercent / 100) * totalPages);
        setCurrentPage(pageFromProgress || 1);
      }
    }
  }, [storyId, title, preferences.viewMode, totalPages]);

  // Get preferences from localStorage if available
  useEffect(() => {
    const savedPreferences = localStorage.getItem("reader-preferences");
    if (savedPreferences) {
      try {
        setPreferences(JSON.parse(savedPreferences));
      } catch (e) {
        console.error("Failed to parse saved reader preferences");
      }
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem("reader-preferences", JSON.stringify(preferences));
  }, [preferences]);

  // Page navigation handlers
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      const newProgress = Math.min(100, Math.round((currentPage / totalPages) * 100));
      setReadProgress(newProgress);
      
      // Save progress
      const progressKey = storyId ? `reading-progress-${storyId}` : `reading-progress-${title}`;
      localStorage.setItem(progressKey, newProgress.toString());
    }
  };
  
  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      const newProgress = Math.max(0, Math.round(((currentPage - 1) / totalPages) * 100));
      setReadProgress(newProgress);
      
      // Save progress
      const progressKey = storyId ? `reading-progress-${storyId}` : `reading-progress-${title}`;
      localStorage.setItem(progressKey, newProgress.toString());
    }
  };

  // Generate the appropriate class names based on preferences
  const readerClasses = `
    reader-wrapper 
    reader-theme-${preferences.theme} 
    reader-font-${preferences.fontFamily} 
    reader-text-${preferences.fontSize}
    ${preferences.viewMode === "paginated" ? "reader-paginated" : ""}
  `;

  // CSS classes to mimic book paper appearance
  const paperClasses =
    "bg-[#FBF8F1] shadow-lg border border-amber-200 rounded-md mx-auto p-6 md:p-10 max-w-3xl lg:max-w-4xl";

  // Render different content types
  const renderContentSection = (section: any) => {
    if (section.type === 'pdf') {
      return (
        <div key={section.index} className="mb-12 bg-white rounded-xl shadow-lg border border-amber-100 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-50 to-amber-100 px-6 py-4 border-b border-amber-200">
            <h3 className="text-2xl font-bold text-amber-900 font-cinzel flex items-center">
              <FileText className="mr-3 h-6 w-6 text-amber-700" />
              {section.title}
            </h3>
            <p className="text-amber-700 text-sm mt-1">PDF Chapter</p>
          </div>
          
          <div className="p-6">
            <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 p-8 text-center mb-6">
              <div className="flex flex-col items-center">
                <div className="bg-red-100 p-4 rounded-full mb-4">
                  <FileText className="h-12 w-12 text-red-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-800 mb-2">PDF Chapter Available</h4>
                <p className="text-gray-600 mb-6 max-w-md">
                  This chapter is available as a PDF document. Click below to view or download the full content.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                  <a
                    href={`${section.url}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View PDF
                  </a>
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = section.url;
                      link.download = `${section.title}.pdf`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </button>
                </div>
              </div>
            </div>
            
            {/* Optional: Embedded viewer for better UX */}
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Quick Preview</span>
                <span className="text-xs text-gray-500">Full version available above</span>
              </div>
              <div className="w-full h-64 bg-white rounded border border-gray-200 overflow-hidden">
                <iframe
                  src={`${section.url}#toolbar=0&navpanes=0&scrollbar=0`}
                  width="100%"
                  height="100%"
                  className="border-0"
                  title={`Preview of ${section.title}`}
                />
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    if (section.type === 'audio') {
      return (
        <div key={section.index} className="mb-8 border border-amber-200 rounded-lg p-4 bg-amber-50">
          <h3 className="text-xl font-bold mb-4 text-amber-800">{section.title}</h3>
          <audio controls className="w-full">
            <source src={section.url} />
            Your browser does not support the audio element.
          </audio>
        </div>
      );
    }
    
    if (section.type === 'image') {
      return (
        <div key={section.index} className="mb-8 border border-amber-200 rounded-lg p-4 bg-amber-50">
          <h3 className="text-xl font-bold mb-4 text-amber-800">{section.title}</h3>
          <img 
            src={section.url} 
            alt={section.title}
            className="w-full max-w-2xl mx-auto rounded shadow-lg"
          />
        </div>
      );
    }
    
    // Regular text content
    return (
      <p key={section.index} className="mb-6 text-reader first-letter:text-lg first-letter:font-semibold">
        {section.content}
      </p>
    );
  };

  // Format content based on view mode
  const formattedContent = preferences.viewMode === "paginated" 
    ? renderPaginatedContent() 
    : (
      <div>
        {pdfChapters.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <FileText className="mr-3 h-6 w-6 text-red-600" />
              PDF Chapters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pdfChapters.map((chapter, index) => (
                <div key={index} className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="text-center">
                    <div className="bg-red-100 p-3 rounded-full mb-4 inline-block">
                      <FileText className="h-8 w-8 text-red-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">{chapter.title}</h4>
                    <p className="text-sm text-gray-600 mb-4">Chapter {chapter.chapterNumber}</p>
                    
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          // Use Google Docs viewer to ensure PDF opens inline without download
                          const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(chapter.url)}&embedded=true`;
                          window.open(googleDocsUrl, '_blank');
                        }}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center text-sm"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View PDF
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            // Fetch the PDF as blob to ensure proper download
                            const response = await fetch(chapter.url);
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `${chapter.title}.pdf`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            
                            // Clean up the blob URL
                            window.URL.revokeObjectURL(url);
                          } catch (error) {
                            console.error('Download failed:', error);
                            // Fallback to direct link
                            const link = document.createElement('a');
                            link.href = chapter.url;
                            link.download = `${chapter.title}.pdf`;
                            link.target = '_blank';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }
                        }}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center text-sm"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {audioChapters.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <Music className="mr-3 h-6 w-6 text-blue-600" />
              Audio Chapters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {audioChapters.map((chapter, index) => (
                <div key={index} className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 shadow-lg">
                  <div className="text-center">
                    <div className="bg-blue-100 p-3 rounded-full mb-4 inline-block">
                      <Music className="h-8 w-8 text-blue-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">{chapter.title}</h4>
                    <p className="text-sm text-gray-600 mb-4">Chapter {chapter.chapterNumber}</p>
                    <audio controls className="w-full">
                      <source src={chapter.url} type="audio/mpeg" />
                      <source src={chapter.url} type="audio/wav" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {imageChapters.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <Layers className="mr-3 h-6 w-6 text-green-600" />
              Image Chapters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {imageChapters.map((chapter, index) => (
                <div key={index} className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6 shadow-lg">
                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">{chapter.title}</h4>
                    <p className="text-sm text-gray-600 mb-4">Chapter {chapter.chapterNumber}</p>
                    <img 
                      src={chapter.url} 
                      alt={chapter.title}
                      className="max-w-full h-auto rounded-lg shadow-md mx-auto"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {textChapters.length > 0 && (
          <div ref={contentRef} className="reader-content">
            {textChapters.map((chapter, index) => (
              <div key={index} className="mb-8">
                <h3 className="text-xl font-bold mb-4">{chapter.title}</h3>
                <div 
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: chapter.body.replace(/\n/g, '<br />') 
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );

  // Helper function for paginated view
  function renderPaginatedContent() {
    // Simple pagination - just divide content sections into pages
    const itemsPerPage = Math.max(3, Math.ceil(textChapters.length / totalPages));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, textChapters.length);
    const currentPageContent = textChapters.slice(startIndex, endIndex);
    
    return (
      <div className="space-y-6">
        {currentPageContent.map((chapter: any, index: number) => (
          <div key={index} className="mb-8">
            <h3 className="text-xl font-bold mb-4">{chapter.title}</h3>
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: chapter.body.replace(/\n/g, '<br />') 
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="my-8">

      {/* Optional soundtrack */}
      {audioUrl && (
        <div className="mb-6 flex items-center gap-3">
          <Music className="h-5 w-5 text-amber-600" />
          <audio controls className="w-full">
            <source src={audioUrl} />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
      
      {/* Story title and actions */}
      <div className={`${readerClasses} ${paperClasses} mb-8`}>
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-yellow-500">{title}</h1>
            <p className="text-yellow-400">By {author}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onBookmark}
              title={isBookmarked ? "Remove bookmark" : "Bookmark this story"}
            >
              <Bookmark 
                className={`h-5 w-5 ${isBookmarked ? "fill-amber-500 text-amber-500" : ""}`} 
              />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              title="Share this story"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Reading progress indicator */}
        <div className="w-full bg-muted h-1 rounded-full mb-8">
          <div 
            className="bg-amber-500 h-1 rounded-full" 
            style={{ width: `${readProgress}%` }}
          ></div>
        </div>

        {/* Story content */}
        <div className="reading-container" ref={contentRef}>
          {formattedContent}
        </div>
        
        {/* Pagination controls - only show in paginated mode */}
        {preferences.viewMode === "paginated" && (
          <div className="flex justify-between items-center mt-8 pt-4 border-t border-muted">
            <Button
              variant="outline"
              onClick={goToPrevPage}
              disabled={currentPage <= 1}
              className="bg-amber-50 hover:bg-amber-100 border-amber-200"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            
            <Button
              variant="outline"
              onClick={goToNextPage}
              disabled={currentPage >= totalPages}
              className="bg-amber-50 hover:bg-amber-100 border-amber-200"
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reader;