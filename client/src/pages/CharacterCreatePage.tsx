import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import charactersBg from "@/assets/hall-of-legends-banner.png";

interface CharacterFormData {
  name: string;
  description: string;
  role: string;
  image: string;
  backgroundStory?: string;
  characterType?: string;
  associatedStories?: number[];
}

export default function CharacterCreatePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<CharacterFormData>({
    name: "",
    description: "",
    role: "Hero",
    image: "",
    backgroundStory: "",
    characterType: "",
    associatedStories: []
  });

  const [imageUploading, setImageUploading] = useState(false);
  const [imagePublicId, setImagePublicId] = useState<string>("");

  const createCharacterMutation = useMutation({
    mutationFn: async (data: CharacterFormData) => {
      const response = await apiRequest("POST", "/api/characters", data);
      return response.json();
    },
    onSuccess: (character) => {
      toast({
        title: "Character Created!",
        description: `${character.name} has been added to the legends.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      setLocation(`/characters/${character.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create character. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiRequest("POST", "/api/upload/file", formData);
      const result = await response.json();
      
      setFormData(prev => ({ ...prev, image: result.url }));
      setImagePublicId(result.public_id);
      toast({
        title: "Image Uploaded",
        description: "Character image has been uploaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setImageUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!imagePublicId) return;
    
    try {
      await apiRequest("DELETE", `/api/upload/${imagePublicId}?type=raw`);
      setFormData(prev => ({ ...prev, image: "" }));
      setImagePublicId("");
      toast({
        title: "Image Deleted",
        description: "Character image has been removed.",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.description.trim() || !formData.image) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (name, description, and image).",
        variant: "destructive",
      });
      return;
    }

    createCharacterMutation.mutate(formData);
  };

  const roleOptions = [
    "Hero", "Villain", "Creature", "Mentor", "Guardian", 
    "Trickster", "Sage", "Warrior", "Mage", "Rogue"
  ];

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-[#0b0704]"
      style={{ backgroundImage: `url(${charactersBg})` }}
    >
      <Helmet>
        <title>Create New Character - Hekayaty</title>
        <meta name="description" content="Create a new character for the Hekayaty universe." />
      </Helmet>

      {/* Overlay for better readability */}
      <div className="min-h-screen bg-black/60 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => setLocation("/characters")}
              className="text-amber-200 hover:text-amber-100 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Characters
            </Button>
            
            <div className="text-center mb-8">
              <h1 className="font-cinzel text-4xl md:text-5xl text-amber-100 mb-2 flex items-center justify-center gap-3">
                <Sparkles className="w-8 h-8 text-amber-300" />
                Create New Character
                <Sparkles className="w-8 h-8 text-amber-300" />
              </h1>
              <p className="font-cormorant italic text-lg text-amber-200">
                Bring a new legend to life in the world of Hekayaty
              </p>
            </div>
          </div>

          {/* Form */}
          <Card className="max-w-2xl mx-auto bg-[#1d140c]/90 border-amber-800/30">
            <CardHeader>
              <CardTitle className="font-cinzel text-2xl text-amber-100 text-center">
                Character Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Character Image */}
                <div className="space-y-2">
                  <label className="text-amber-200 font-medium">Character Image *</label>
                  <div className="flex flex-col items-center space-y-4">
                    {formData.image ? (
                      <div className="relative">
                        <img
                          src={formData.image}
                          alt="Character preview"
                          className="w-48 h-48 object-cover rounded-lg border-2 border-amber-600"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-8 w-8 rounded-full p-0"
                          onClick={handleDeleteImage}
                          disabled={imageUploading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="w-48 h-48 border-2 border-dashed border-amber-600 rounded-lg flex items-center justify-center bg-amber-900/10">
                        <div className="text-center">
                          <Upload className="mx-auto h-12 w-12 text-amber-400 mb-2" />
                          <p className="text-amber-300 text-sm">Upload character image</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center space-x-4">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                        }}
                        className="bg-amber-900/20 border-amber-700 text-amber-100"
                        disabled={imageUploading}
                      />
                      {imageUploading && (
                        <div className="flex items-center text-amber-300">
                          <Upload className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Character Name */}
                <div className="space-y-2">
                  <label className="text-amber-200 font-medium">Character Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter character name..."
                    className="bg-amber-900/20 border-amber-700 text-amber-100 placeholder:text-amber-400"
                    required
                  />
                </div>

                {/* Character Role */}
                <div className="space-y-2">
                  <label className="text-amber-200 font-medium">Character Role *</label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger className="bg-amber-900/20 border-amber-700 text-amber-100">
                      <SelectValue placeholder="Select character role" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1d140c] border-amber-700">
                      {roleOptions.map((role) => (
                        <SelectItem key={role} value={role} className="text-amber-100 focus:bg-amber-900/30">
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Character Type */}
                <div className="space-y-2">
                  <label className="text-amber-200 font-medium">Character Type</label>
                  <Input
                    value={formData.characterType || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, characterType: e.target.value }))}
                    placeholder="e.g., Human, Elf, Dragon, Spirit..."
                    className="bg-amber-900/20 border-amber-700 text-amber-100 placeholder:text-amber-400"
                  />
                </div>

                {/* Character Description */}
                <div className="space-y-2">
                  <label className="text-amber-200 font-medium">Character Description *</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the character's appearance, personality, and key traits..."
                    className="bg-amber-900/20 border-amber-700 text-amber-100 placeholder:text-amber-400 min-h-[100px]"
                    required
                  />
                </div>

                {/* Background Story */}
                <div className="space-y-2">
                  <label className="text-amber-200 font-medium">Background Story</label>
                  <Textarea
                    value={formData.backgroundStory || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, backgroundStory: e.target.value }))}
                    placeholder="Tell the character's origin story, history, and motivations..."
                    className="bg-amber-900/20 border-amber-700 text-amber-100 placeholder:text-amber-400 min-h-[120px]"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-center pt-4">
                  <Button
                    type="submit"
                    disabled={createCharacterMutation.isPending || imageUploading}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-cinzel px-8 py-3 text-lg"
                  >
                    {createCharacterMutation.isPending ? (
                      <>
                        <Upload className="w-4 h-4 mr-2 animate-spin" />
                        Creating Character...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Create Character
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
