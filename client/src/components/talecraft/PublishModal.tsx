import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, FileText, File, Crown, Shield } from "lucide-react";
import { GENRE_PAGES, PUBLISH_PAGES, type TaleCraftPublish } from "@shared/schema";

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectType: "story" | "comic";
  projectTitle: string;
  projectContent: string;
  onPublish: (data: TaleCraftPublish) => Promise<void>;
  userIsAdmin?: boolean;
  allowedPages?: readonly string[];
}

export default function PublishModal({
  isOpen,
  onClose,
  projectType,
  projectTitle,
  projectContent,
  onPublish,
  userIsAdmin = false,
  allowedPages = PUBLISH_PAGES,
}: PublishModalProps) {
  const [formData, setFormData] = useState<Partial<TaleCraftPublish>>({
    title: projectTitle,
    description: "",
    authorName: "",
    content: projectContent,
    coverImage: "",
    genre: projectType === "comic" ? undefined : "adventure",
    page: projectType === "comic" ? "epic_comics" : "adventure",
    projectType,
    format: "html",
    isPremium: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableGenres = projectType === "comic" 
    ? []
    : [
        { value: "adventure", label: "Adventure", icon: "🗡️" },
        { value: "romance", label: "Romance", icon: "💕" },
        { value: "scifi", label: "Sci-Fi", icon: "🚀" },
        { value: "writers_gems", label: "Writer's Gems", icon: "💎" },
        ...(userIsAdmin ? [{ value: "hekayaty_original", label: "Hekayaty Original", icon: "👑" }] : [])
      ].filter(g => allowedPages.includes(g.value));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.authorName) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (projectType === "story" && !formData.genre) {
      toast.error("Please select a genre for your story");
      return;
    }

    if (!formData.page) {
      toast.error("Please select a page to publish to");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const publishData: TaleCraftPublish = {
        title: formData.title!,
        description: formData.description!,
        authorName: formData.authorName!,
        content: formData.content!,
        coverImage: formData.coverImage || "",
        genre: projectType === "comic" ? "adventure" : formData.genre!, // Default for comics
        page: formData.page!,
        projectType,
        format: formData.format!,
        isPremium: formData.isPremium!,
      };

      await onPublish(publishData);
      toast.success(`${projectType === "comic" ? "Comic" : "Story"} published successfully!`);
      onClose();
    } catch (error) {
      toast.error("Failed to publish. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDestinationPage = () => {
    if (projectType === "comic") return "Epic Comics";
    return formData.page ? GENRE_PAGES[formData.page as keyof typeof GENRE_PAGES] || "Unknown" : "Unknown";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Publish {projectType === "comic" ? "Comic" : "Story"}
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Share your {projectType} with the world. It will be published to the{" "}
            <Badge variant="secondary" className="mx-1">
              {getDestinationPage()}
            </Badge>
            page.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">Title *</Label>
            <Input
              id="title"
              value={formData.title || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="bg-gray-700 border-gray-600 text-white"
              placeholder="Enter your story title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="authorName" className="text-white">Author Name *</Label>
            <Input
              id="authorName"
              value={formData.authorName || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, authorName: e.target.value }))}
              className="bg-gray-700 border-gray-600 text-white"
              placeholder="Enter your name or pen name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">Description *</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
              placeholder="Write a compelling description for your story..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverImage" className="text-white">Cover Image URL (Optional)</Label>
            <Input
              id="coverImage"
              value={formData.coverImage || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, coverImage: e.target.value }))}
              className="bg-gray-700 border-gray-600 text-white"
              placeholder="https://example.com/cover.jpg"
            />
          </div>

          {projectType === "story" && (
            <div className="space-y-2">
              <Label className="text-white">Page *</Label>
              <Select
                value={formData.page || ""}
                onValueChange={(value) => setFormData(prev => ({ ...prev, page: value as any }))}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Select a page" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {availableGenres.map((g) => (
                    <SelectItem key={g.value} value={g.value} className="text-white hover:bg-gray-600">
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {projectType === "story" && (
            <div className="space-y-2">
              <Label className="text-white">Genre *</Label>
              <Select
                value={formData.genre || ""}
                onValueChange={(value) => setFormData(prev => ({ ...prev, genre: value as any }))}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Select a genre" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {availableGenres.map((genre) => (
                    <SelectItem key={genre.value} value={genre.value} className="text-white hover:bg-gray-600">
                      <div className="flex items-center gap-2">
                        <span>{genre.icon}</span>
                        <span>{genre.label}</span>
                        {genre.value === "hekayaty_original" && (
                          <Shield className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-white">Export Format</Label>
            <Select
              value={formData.format || "html"}
              onValueChange={(value) => setFormData(prev => ({ ...prev, format: value as any }))}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="html" className="text-white hover:bg-gray-600">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    HTML (Web Format)
                  </div>
                </SelectItem>
                <SelectItem value="pdf" className="text-white hover:bg-gray-600">
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4" />
                    PDF (Printable)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="premium"
              checked={formData.isPremium || false}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPremium: !!checked }))}
              className="border-gray-600"
            />
            <Label htmlFor="premium" className="text-white flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-500" />
              Premium Content
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-600 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? "Publishing..." : "Publish"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
