import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, ArrowLeft, Save } from "lucide-react";
import { Helmet } from "react-helmet";

interface Story {
  id: string;
  title: string;
}

const CHARACTER_TYPES = [
  { value: "hero", label: "Hero" },
  { value: "main", label: "Main Character" },
  { value: "villain", label: "Villain" },
  { value: "creature", label: "Creature" },
  { value: "supporting", label: "Supporting Character" }
];

export default function CreateCharacterPage() {
  const [, navigate] = useLocation();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    backgroundStory: "",
    characterType: "",
    associatedStories: [] as string[],
  });

  // Fetch available stories for association
  const { data: stories = [] } = useQuery<Story[]>({
    queryKey: ["/api/stories"],
    queryFn: async () => (await apiRequest("GET", "/api/stories")).json(),
  });

  // Image upload mutation
  const uploadImage = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await apiRequest("POST", "/api/upload/file", formData);
      return response.json();
    },
  });

  // Create character mutation
  const createCharacter = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/characters", data);
      return response.json();
    },
    onSuccess: () => {
      navigate("/characters");
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.backgroundStory || !formData.characterType) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      let imageUrl = "";
      
      // Upload image if provided
      if (imageFile) {
        const uploadResult = await uploadImage.mutateAsync(imageFile);
        imageUrl = uploadResult.url;
      }

      // Create character
      await createCharacter.mutateAsync({
        name: formData.name,
        description: formData.backgroundStory,
        backgroundStory: formData.backgroundStory,
        characterType: formData.characterType,
        role: formData.characterType, // For backward compatibility
        image: imageUrl,
        associatedStories: formData.associatedStories,
      });
    } catch (error) {
      console.error("Error creating character:", error);
      alert("Failed to create character. Please try again.");
    }
  };

  const handleStoryToggle = (storyId: string) => {
    setFormData(prev => ({
      ...prev,
      associatedStories: prev.associatedStories.includes(storyId)
        ? prev.associatedStories.filter(id => id !== storyId)
        : [...prev.associatedStories, storyId]
    }));
  };

  return (
    <div className="min-h-screen bg-[#0b0704] py-8">
      <Helmet>
        <title>Create New Character - Hekayaty</title>
        <meta name="description" content="Create a new character for Hekayaty stories" />
      </Helmet>

      <div className="container mx-auto max-w-4xl px-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/characters")}
            className="text-amber-200 hover:text-amber-100 hover:bg-amber-900/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Characters
          </Button>
        </div>

        <Card className="bg-[#1d140c]/80 border-amber-700 text-amber-50">
          <CardHeader>
            <CardTitle className="font-cinzel text-2xl text-amber-100 text-center">
              Create New Character
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Character Image Upload */}
              <div className="space-y-2">
                <Label className="text-amber-200 font-cinzel">Character Photo</Label>
                <div className="flex flex-col items-center space-y-4">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Character preview"
                        className="w-48 h-48 object-cover rounded-lg border-2 border-amber-700"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview("");
                        }}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700"
                      >
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <div className="w-48 h-48 border-2 border-dashed border-amber-700 rounded-lg flex items-center justify-center">
                      <Upload className="h-12 w-12 text-amber-600" />
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="bg-amber-900/20 border-amber-700 text-amber-100"
                  />
                </div>
              </div>

              {/* Character Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-amber-200 font-cinzel">
                  Character Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter character name"
                  className="bg-amber-900/20 border-amber-700 text-amber-100 placeholder:text-amber-400"
                  required
                />
              </div>

              {/* Character Type */}
              <div className="space-y-2">
                <Label className="text-amber-200 font-cinzel">Character Type *</Label>
                <Select
                  value={formData.characterType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, characterType: value }))}
                >
                  <SelectTrigger className="bg-amber-900/20 border-amber-700 text-amber-100">
                    <SelectValue placeholder="Select character type" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1d140c] border-amber-700">
                    {CHARACTER_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="text-amber-100 hover:bg-amber-900/20">
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Background Story */}
              <div className="space-y-2">
                <Label htmlFor="backgroundStory" className="text-amber-200 font-cinzel">
                  Background Story *
                </Label>
                <Textarea
                  id="backgroundStory"
                  value={formData.backgroundStory}
                  onChange={(e) => setFormData(prev => ({ ...prev, backgroundStory: e.target.value }))}
                  placeholder="Write the character's background story..."
                  rows={6}
                  className="bg-amber-900/20 border-amber-700 text-amber-100 placeholder:text-amber-400"
                  required
                />
              </div>

              {/* Associated Stories (Optional) */}
              <div className="space-y-2">
                <Label className="text-amber-200 font-cinzel">
                  Associated Stories (Optional)
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {stories.map((story) => (
                    <div key={story.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`story-${story.id}`}
                        checked={formData.associatedStories.includes(story.id)}
                        onChange={() => handleStoryToggle(story.id)}
                        className="rounded border-amber-700 bg-amber-900/20 text-amber-600 focus:ring-amber-500"
                      />
                      <label
                        htmlFor={`story-${story.id}`}
                        className="text-sm text-amber-200 cursor-pointer"
                      >
                        {story.title}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-4">
                <Button
                  type="submit"
                  disabled={createCharacter.isPending || uploadImage.isPending}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-cinzel px-8 py-2"
                >
                  {createCharacter.isPending || uploadImage.isPending ? (
                    "Publishing..."
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Publish Character
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
