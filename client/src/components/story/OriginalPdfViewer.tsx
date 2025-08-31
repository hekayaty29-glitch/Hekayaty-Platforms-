import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Bookmark, Share2, Eye } from "lucide-react";

interface OriginalPdfViewerProps {
  title: string;
  author: string;
  pdfUrl: string;
  audioUrl?: string;
}

const OriginalPdfViewer: React.FC<OriginalPdfViewerProps> = ({ title, author, pdfUrl, audioUrl }) => {

  return (
    <div className="reader-wrapper reader-theme-light reader-font-serif reader-text-md bg-[#FBF8F1] shadow-lg border border-amber-200 rounded-md mx-auto p-6 md:p-10 max-w-3xl lg:max-w-4xl mb-8">
      {/* Header with controls */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          <p className="text-muted-foreground">By {author}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" title="Bookmark this story">
            <Bookmark className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" title="Share this story">
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>


      {/* PDF Content - Simplified without react-pdf */}
      <div className="text-center">
        {!pdfUrl ? (
          <div className="py-20 text-center text-muted-foreground">
            <p>No PDF URL provided</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">PDF Document</h3>
              <p className="text-sm text-muted-foreground mb-4">Click to view the full document</p>
            </div>
            
            <div className="space-y-4">
              <Button 
                onClick={() => {
                  // For base64 PDFs, create a blob URL and open directly
                  if (pdfUrl.startsWith('data:application/pdf;base64,')) {
                    const base64Data = pdfUrl.split(',')[1];
                    const byteCharacters = atob(base64Data);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                      byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: 'application/pdf' });
                    const blobUrl = URL.createObjectURL(blob);
                    window.open(blobUrl, '_blank');
                  } else {
                    // For regular URLs, open directly
                    window.open(pdfUrl, '_blank');
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Eye className="h-4 w-4 mr-2" />
                View PDF
              </Button>
              
              <div className="border rounded-lg p-4">
                <iframe 
                  src={pdfUrl}
                  width="100%" 
                  height="600px"
                  className="border-0 rounded"
                  title="PDF Viewer"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OriginalPdfViewer;
