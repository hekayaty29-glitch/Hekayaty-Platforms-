import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, CheckCircle, ExternalLink } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface ComicPreviewStepProps {
  data: {
    title: string;
    description: string;
    coverImage: string;
    genre: string[];
    authorName: string;
    collaborators: { id: string; fullName: string }[];
    pdfUrl: string;
    isPremium: boolean;
    workshopId?: string;
  };
  onUpdate: (updates: any) => void;
  onPrevious: () => void;
  user: any;
}

export default function ComicPreviewStep({ data, onUpdate, onPrevious, user }: ComicPreviewStepProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const publishMutation = useMutation({
    mutationFn: async () => {
      const comicData = {
        title: data.title,
        description: data.description,
        pdfUrl: data.pdfUrl,
        coverImage: data.coverImage,
        isPremium: data.isPremium,
        isPublished: true,
        workshopId: data.workshopId
      };

      const res = await apiRequest("POST", "/api/comics", comicData);
      return res.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/comics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      toast({ 
        title: "Comic published successfully!", 
        description: "Your comic is now live on Epic Comics." 
      });
      navigate(`/story/${result.id}`);
    },
    onError: (err: Error) => {
      toast({ 
        title: "Publishing failed", 
        description: err.message, 
        variant: "destructive" 
      });
    }
  });

  const handlePublish = () => {
    publishMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Preview Your Comic</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cover and Basic Info */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              {data.coverImage ? (
                <img
                  src={data.coverImage}
                  alt="Comic cover"
                  className="w-48 h-64 object-cover rounded-lg shadow-md"
                />
              ) : (
                <div className="w-48 h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">No cover image</span>
                </div>
              )}
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-brown-dark">{data.title}</h2>
                <p className="text-gray-600">by {data.authorName}</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-700 leading-relaxed">{data.description}</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {data.genre.map((genre) => (
                    <Badge key={genre} variant="secondary">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {data.collaborators.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Collaborators</h3>
                  <div className="flex flex-wrap gap-2">
                    {data.collaborators.map((collab) => (
                      <Badge key={collab.id} variant="outline">
                        {collab.fullName}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Comic Content Info */}
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Comic Content</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="font-medium">PDF File:</span>
                  <span className="text-sm text-gray-600 truncate max-w-md">
                    {data.pdfUrl}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(data.pdfUrl, '_blank')}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Preview
                </Button>
              </div>
              
              {data.isPremium && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span className="text-amber-800 font-medium">Premium Content</span>
                </div>
              )}
            </div>
          </div>

          {/* Publication Destination */}
          <div className="border-t pt-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                <span className="font-medium text-purple-800">Publication Destination</span>
              </div>
              <p className="text-sm text-purple-700">
                Your comic will be published to <strong>Epic Comics</strong> where readers can discover and enjoy visual stories.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Previous
        </Button>
        
        <Button 
          onClick={handlePublish} 
          disabled={publishMutation.isPending}
          className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
        >
          {publishMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Publishing...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              Publish to Epic Comics
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
