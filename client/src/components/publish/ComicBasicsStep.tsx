import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, X, ArrowRight } from "lucide-react";
import { useEffect } from "react";

interface ComicBasicsStepProps {
  data: {
    title: string;
    description: string;
    coverImage: string;
    genre: string[];
    authorName: string;
    collaborators: { id: string; fullName: string }[];
  };
  onUpdate: (updates: any) => void;
  onNext: () => void;
}

const AVAILABLE_GENRES = [
  "Fantasy", "Romance", "Mystery", "Sci-Fi", "Adventure", 
  "Horror", "Drama", "Comedy", "Historical", "Thriller",
  "Action", "Superhero", "Slice of Life"
];

export default function ComicBasicsStep({ data, onUpdate, onNext }: ComicBasicsStepProps) {
  const [coverPreview, setCoverPreview] = useState<string>(data.coverImage || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [collabQuery, setCollabQuery] = useState("");
  const [collabResults, setCollabResults] = useState<{ id: string; fullName: string; email?: string }[]>([]);

  const handleCoverUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors(prev => ({ ...prev, cover: "Image must be less than 5MB" }));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCoverPreview(result);
        onUpdate({ coverImage: result });
        setErrors(prev => ({ ...prev, cover: "" }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addGenre = (genre: string) => {
    if (!data.genre.includes(genre) && data.genre.length < 3) {
      onUpdate({ genre: [...data.genre, genre] });
    }
  };

  const removeGenre = (genre: string) => {
    onUpdate({ genre: data.genre.filter(g => g !== genre) });
  };

  // search collaborators
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (collabQuery.trim().length < 2) {
        setCollabResults([]);
        return;
      }
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(collabQuery)}`);
        if (res.ok) {
          const users = await res.json();
          setCollabResults(users);
        }
      } catch (e) {
        console.error("User search error", e);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [collabQuery]);

  const addCollaborator = (user: { id: string; fullName: string }) => {
    if (!data.collaborators.find((c) => c.id === user.id)) {
      onUpdate({ collaborators: [...data.collaborators, user] });
    }
  };

  const removeCollaborator = (id: string) => {
    onUpdate({ collaborators: data.collaborators.filter((c) => c.id !== id) });
  };

  const validateAndNext = () => {
    const newErrors: Record<string, string> = {};
    
    if (!data.title.trim()) newErrors.title = "Title is required";
    if (!data.description.trim()) newErrors.description = "Description is required";
    if (data.description.length < 50) newErrors.description = "Description must be at least 50 characters";
    if (!data.authorName.trim()) newErrors.authorName = "Author name is required";
    if (data.genre.length === 0) newErrors.genre = "Select at least one genre";

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onNext();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comic Basics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cover Image */}
        <div>
          <Label htmlFor="cover">Cover Image</Label>
          <div className="mt-2">
            {coverPreview ? (
              <div className="relative w-48 h-64 mx-auto">
                <img 
                  src={coverPreview} 
                  alt="Cover preview" 
                  className="w-full h-full object-cover rounded-lg shadow-md"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setCoverPreview("");
                    onUpdate({ coverImage: "" });
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-48 h-64 mx-auto border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <Upload className="h-12 w-12 text-gray-400 mb-4" />
                <span className="text-sm text-gray-500">Click to upload cover</span>
                <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleCoverUpload}
                />
              </label>
            )}
          </div>
          {errors.cover && <p className="text-red-500 text-sm mt-1">{errors.cover}</p>}
        </div>

        {/* Title */}
        <div>
          <Label htmlFor="title">Comic Title *</Label>
          <Input
            id="title"
            value={data.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Enter your comic title"
            className={errors.title ? "border-red-500" : ""}
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={data.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Describe your comic (minimum 50 characters)"
            rows={4}
            className={errors.description ? "border-red-500" : ""}
          />
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>{data.description.length} characters</span>
            {errors.description && <span className="text-red-500">{errors.description}</span>}
          </div>
        </div>

        {/* Author Name */}
        <div>
          <Label htmlFor="authorName">Author/Workshop Name *</Label>
          <Input
            id="authorName"
            value={data.authorName}
            onChange={(e) => onUpdate({ authorName: e.target.value })}
            placeholder="Your name or workshop name"
            className={errors.authorName ? "border-red-500" : ""}
          />
          {errors.authorName && <p className="text-red-500 text-sm mt-1">{errors.authorName}</p>}
        </div>

        {/* Collaborators */}
        <div>
          <Label>Collaborators (optional)</Label>
          <div className="mt-2 space-y-2">
            {/* search input */}
            <Input
              placeholder="Search users by name or email"
              value={collabQuery}
              onChange={(e) => setCollabQuery(e.target.value)}
            />
            {collabResults.length > 0 && (
              <div className="border rounded p-2 max-h-40 overflow-y-auto bg-white shadow">
                {collabResults.map((user) => (
                  <div
                    key={user.id}
                    className="p-1 cursor-pointer hover:bg-gray-100 text-sm"
                    onClick={() => addCollaborator(user)}
                  >
                    {user.fullName || user.email}
                  </div>
                ))}
              </div>
            )}
            {/* selected collaborators */}
            <div className="flex flex-wrap gap-2">
              {data.collaborators.map((u) => (
                <Badge key={u.id} variant="secondary" className="flex items-center gap-1">
                  {u.fullName}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeCollaborator(u.id)} />
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Publication Notice */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
            <span className="font-medium text-purple-800">Publication Destination</span>
          </div>
          <p className="text-sm text-purple-700">
            Your comic will be published to <strong>Epic Comics</strong> section where readers can discover and enjoy visual stories.
          </p>
        </div>

        {/* Genres */}
        <div>
          <Label>Genres * (Select up to 3)</Label>
          <div className="mt-2">
            <div className="flex flex-wrap gap-2 mb-3">
              {data.genre.map((genre) => (
                <Badge key={genre} variant="default" className="flex items-center gap-1">
                  {genre}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeGenre(genre)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_GENRES.filter(g => !data.genre.includes(g)).map((genre) => (
                <Button
                  key={genre}
                  variant="outline"
                  size="sm"
                  onClick={() => addGenre(genre)}
                  disabled={data.genre.length >= 3}
                >
                  + {genre}
                </Button>
              ))}
            </div>
          </div>
          {errors.genre && <p className="text-red-500 text-sm mt-1">{errors.genre}</p>}
        </div>

        {/* Next Button */}
        <div className="flex justify-end pt-4">
          <Button onClick={validateAndNext} className="flex items-center gap-2">
            Next: Add Comic Content
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
