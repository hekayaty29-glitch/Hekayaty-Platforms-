import { useState } from "react";
import { useRoles } from "@/hooks/useRoles";
import { useAuth } from "@/lib/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, ExternalLink } from "lucide-react";

interface Ad {
  id: string;
  imageUrl: string;
  linkUrl: string;
  title: string;
}

export default function AdsBanner() {
  const { isFree, isAdmin } = useRoles();
  const { user } = useAuth();
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [currentAd, setCurrentAd] = useState<Ad | null>({
    id: "1",
    imageUrl: "",
    linkUrl: "https://example.com",
    title: "Sponsored Ad"
  });
  
  const [newAd, setNewAd] = useState({
    title: "",
    linkUrl: "",
    imageUrl: ""
  });

  if (!isFree) return null;

  const handleBannerClick = () => {
    if (isAdmin) {
      setShowAdminModal(true);
    } else if (currentAd?.linkUrl) {
      window.open(currentAd.linkUrl, '_blank');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'ads');

      const response = await fetch('/api/upload/file', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setNewAd(prev => ({ ...prev, imageUrl: data.url }));
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleSaveAd = () => {
    if (newAd.title && newAd.linkUrl) {
      setCurrentAd({
        id: Date.now().toString(),
        title: newAd.title,
        linkUrl: newAd.linkUrl,
        imageUrl: newAd.imageUrl
      });
      setShowAdminModal(false);
      setNewAd({ title: "", linkUrl: "", imageUrl: "" });
    }
  };

  return (
    <>
      <div 
        className={`w-full bg-yellow-900/20 text-center py-3 text-sm text-yellow-300 font-medium cursor-pointer hover:bg-yellow-900/30 transition-colors flex items-center justify-center gap-2 ${
          isAdmin ? 'border-2 border-dashed border-yellow-500/50' : ''
        }`}
        onClick={handleBannerClick}
      >
        {currentAd?.imageUrl && (
          <img 
            src={currentAd.imageUrl} 
            alt={currentAd.title}
            className="h-6 w-auto"
          />
        )}
        <span>{currentAd?.title || "— Sponsored Ad —"}</span>
        {!isAdmin && currentAd?.linkUrl && (
          <ExternalLink className="h-4 w-4" />
        )}
        {isAdmin && (
          <span className="text-xs opacity-75">(Click to edit)</span>
        )}
      </div>

      <Dialog open={showAdminModal} onOpenChange={setShowAdminModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Advertisement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ad-title">Ad Title</Label>
              <Input
                id="ad-title"
                placeholder="Enter ad title"
                value={newAd.title}
                onChange={(e) => setNewAd(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="ad-link">Link URL</Label>
              <Input
                id="ad-link"
                placeholder="https://example.com"
                value={newAd.linkUrl}
                onChange={(e) => setNewAd(prev => ({ ...prev, linkUrl: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="ad-image">Ad Image (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="ad-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('ad-image')?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Image
                </Button>
                {newAd.imageUrl && (
                  <img src={newAd.imageUrl} alt="Preview" className="h-8 w-auto" />
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAdminModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAd} disabled={!newAd.title || !newAd.linkUrl}>
                Save Ad
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
