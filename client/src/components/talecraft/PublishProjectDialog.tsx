import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { uploadComicImage } from "@/lib/fastUpload";
import { supabase } from "@/lib/supabase";

export interface PublishProjectPayload {
  title: string;
  description: string;
  projectType: "comic" | "story";
  content: any; // serialized project JSON or story markdown
}

interface PublishProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues: PublishProjectPayload;
  onPublished: (projectId: string) => void;
}

const GENRES = [
  "Adventure",
  "Romance",
  "Sci-Fi",
  "Fantasy",
  "Drama",
  "Comedy",
];

// Pages list comes from shared enum to keep UI in sync with backend validation
import { PUBLISH_PAGES } from "@shared/schema";

const PAGE_LABELS: Record<string, string> = {
  adventure: "Adventure",
  romance: "Romance",
  scifi: "Sci-Fi",
  writers_gems: "Writer's Gems",
  hekayaty_original: "Hekayaty Original",
  epic_comics: "Epic Comics",
};

const PAGES = PUBLISH_PAGES.map((id) => ({ id, label: PAGE_LABELS[id] ?? id }));

// Pages only admins can publish to
const ADMIN_ONLY_PAGES = ["hekayaty_original", "tales_of_prophets"] as const;

export function PublishProjectDialog({ open, onOpenChange, defaultValues, onPublished }: PublishProjectDialogProps) {
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [description, setDescription] = useState(defaultValues.description || "");
  const [format, setFormat] = useState<"html" | "pdf">("html");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [genre, setGenre] = useState<string | null>(null);
  const [page, setPage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // fetch profile name once
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsAdmin(!!user.user_metadata?.is_admin);
        setAuthorName(user.user_metadata?.full_name || user.email || "");
      }
    })();
  }, []);

  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadComicImage(file);
      setCoverUrl(res.url);
    } catch (err) {
      setError("Failed to upload cover image");
    }
  };

  const handlePdfSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file");
      return;
    }
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "story-pdfs");
      const resp = await fetch("/api/upload/file", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!resp.ok) throw new Error("Upload failed");
      const json = await resp.json();
      setPdfUrl(json.url);
    } catch (err) {
      setError("Failed to upload PDF");
    }
  };

  const handlePublish = async () => {
    if (!genre || !page) {
    setError("Please select genre and page");
    return;
  }
  if (format === "pdf" && !pdfUrl) {
    setError("Please upload your PDF file");
      setError("Please select genre and page");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const resp = await fetch("/api/projects/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...defaultValues,
          description,
          genre,
          page,
          coverImage: coverUrl,
          authorName,
          format,
          content: format === "html" ? (typeof defaultValues.content === "string" ? defaultValues.content : JSON.stringify(defaultValues.content)) : "",
        contentPath: format === "pdf" ? pdfUrl : undefined,
          isPremium: false,
        }),
      });
      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        throw new Error(errJson.message || "Publish failed");
      }
      const json = await resp.json();
      onPublished(json.id);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Failed to publish project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Publish Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 pb-4">
          <div>
            <label className="text-sm mb-1 block">Cover Image</label>
            <Input type="file" accept="image/*" onChange={handleCoverSelect} />
            {coverUrl && <img src={coverUrl} className="mt-2 w-24 h-24 object-cover rounded" />}
          </div>
          <div>
            <label className="text-sm mb-1 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-800/40 border border-gray-700 rounded p-2 text-sm"
              rows={3}
              placeholder="Short description of the project"
            />
          </div>
          <div>
            <label className="text-sm mb-1 block">Genre</label>
            <Select value={genre || undefined} onValueChange={setGenre as any}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select genre" />
              </SelectTrigger>
              <SelectContent>
                {GENRES.map((g) => (
                  <SelectItem key={g} value={g.toLowerCase()}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm mb-1 block">Format</label>
            <Select value={format} onValueChange={setFormat as any}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="html">HTML (online reader)</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {format === "pdf" && (
            <div>
              <label className="text-sm mb-1 block">Upload PDF</label>
              <Input type="file" accept="application/pdf" onChange={handlePdfSelect} />
              {pdfUrl && <p className="text-green-600 text-sm mt-1">PDF uploaded</p>}
            </div>
          )}
          <div>
            <label className="text-sm mb-1 block">Target Page</label>
            <Select value={page || undefined} onValueChange={setPage as any}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select page" />
              </SelectTrigger>
              <SelectContent>
                {PAGES.filter(p => isAdmin || !ADMIN_ONLY_PAGES.includes(p.id as any)).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handlePublish} disabled={loading}>
            {loading ? "Publishing..." : "Publish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
