import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Edit, CheckCircle, Crown, Star, PenTool, User, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const profileUpdateSchema = z.object({
  fullName: z.string().min(1, "Name is required"),
  bio: z.string().max(500, "Bio must be 500 characters or less"),
  avatar: z.string().url("Please enter a valid image URL").or(z.string().length(0)),
});

interface ProfileHeaderProps {
  user: {
    id: number;
    username: string;
    fullName: string;
    bio: string;
    avatar: string;
    isPremium: boolean;
    isAuthor: boolean;
    email?: string;
    createdAt?: string;
    stats?: {
      storiesCount: number;
      novelsCount: number;
      followersCount: number;
      followingCount: number;
    };
  };
  isOwnProfile: boolean;
  isPremium: boolean;
  onPhotoUpload?: (file: File) => Promise<void>;
}

export default function ProfileHeader({ 
  user, 
  isOwnProfile, 
  isPremium, 
  onPhotoUpload 
}: ProfileHeaderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // Username inline editing
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");

  // ensure focus is retained while typing
  useEffect(() => {
    if (isEditingUsername && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingUsername, usernameInput]);
  
  const form = useForm<z.infer<typeof profileUpdateSchema>>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      fullName: user.fullName,
      bio: user.bio,
      avatar: user.avatar,
    },
  });
  
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileUpdateSchema>) => {
      const res = await apiRequest("PATCH", `/api/users/${user.id}`, data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setIsEditOpen(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
      return data;
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // separate mutation for username
  const updateUsernameMutation = useMutation({
    mutationFn: async ({ username }: { username: string }) => {
      const res = await apiRequest("PUT", `/api/users/${user.id}`, { username });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setIsEditingUsername(false);
      toast({
        title: "Username set",
        description: "Your username has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Username update failed",
        description: error.message || "Failed to set username. It may already be taken.",
        variant: "destructive",
      });
    },
  });

  // Upload new avatar file
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsUploading(true);
      if (onPhotoUpload) {
        await onPhotoUpload(file);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload the profile photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Remove current avatar and revert to default
  const handleRemovePhoto = async () => {
    if (isUploading) return;
    try {
      setIsUploading(true);
      // Clear avatar by setting empty string
      await apiRequest("PATCH", `/api/users/${user.id}`, { avatar: "" });
      await queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}`] });
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      form.setValue("avatar", "");
      toast({
        title: "Avatar removed",
        description: "Your profile photo has been deleted.",
      });
    } catch (err: any) {
      toast({
        title: "Failed to delete photo",
        description: err.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const onSubmit = (data: z.infer<typeof profileUpdateSchema>) => {
    updateProfileMutation.mutate(data);
  };
  
  const stats = [
    { label: 'Stories', value: user.stats?.storiesCount || 0 },
    { label: 'Novels', value: user.stats?.novelsCount || 0 },
    { label: 'Followers', value: user.stats?.followersCount || 0 },
    { label: 'Following', value: user.stats?.followingCount || 0 },
  ];
  
  return (
    <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl border border-amber-200 p-6 shadow-sm">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
        {/* Profile Photo */}
        <div className="relative group">
          <div className="w-36 h-36 rounded-full overflow-hidden bg-amber-200 border-4 border-amber-400/30 shadow-lg">
            <img 
              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=D68C47&color=fff`} 
              alt={`${user.fullName}'s avatar`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" decoding="async"
            />
          </div>
          
          {/* Premium Badge */}
          {isPremium && (
            <Badge className="absolute -top-2 right-2 bg-gradient-to-r from-amber-400 to-amber-600 text-white border-2 border-white shadow-lg px-3 py-1 font-medium">
              <Crown className="h-4 w-4 mr-1.5" /> Premium
            </Badge>
          )}
          
          {/* Author Badge */}
          {user.isAuthor && (
            <Badge className="absolute -bottom-2 left-2 bg-gradient-to-r from-amber-500 to-amber-700 text-white border-2 border-white shadow-lg px-3 py-1 font-medium">
              <PenTool className="h-4 w-4 mr-1.5" /> Author
            </Badge>
          )}
          
          {/* Photo Upload */}
          {isOwnProfile && (
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="h-8 w-8 text-white" />
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </label>
          )}
        </div>
        
        {/* Profile Info */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center justify-center md:justify-start gap-3">
                <h1 className="font-cinzel text-3xl md:text-4xl font-bold text-amber-900">
                  {user.fullName}
                </h1>
                {isPremium && (
                  <Star className="h-6 w-6 text-amber-500 fill-amber-500" />
                )}
              </div>
              {isOwnProfile && !user.username ? (
                isEditingUsername ? (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!usernameInput.trim()) return;
                      try {
                        await updateUsernameMutation.mutateAsync({ username: usernameInput.trim() });
                      } catch (err) {
                        /* handled in mutation */
                      }
                    }}
                    className="flex items-center gap-2 mt-1"
                  >
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="Choose username"
                      className="text-3xl font-bold mb-1 bg-transparent border-b border-amber-300 focus:outline-none focus:border-amber-500 text-brown-dark"
                      ref={inputRef}
                      autoFocus
                    />
                    <Button type="submit" size="sm" disabled={updateUsernameMutation.isPending}>
                      {updateUsernameMutation.isPending ? "Saving" : "Save"}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditingUsername(false)}>
                      Cancel
                    </Button>
                  </form>
                ) : (
                  <button
                    type="button"
                    className="text-amber-700/90 font-medium underline mt-1"
                    onClick={() => {
                      setUsernameInput("");
                      setIsEditingUsername(true);
                    }}
                  >
                    @null (click to set)
                  </button>
                )
              ) : (
                <p className="text-amber-700/90 font-medium mt-1">@{user.username}</p>
              )}

              
              {/* Stats */}
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-2xl font-bold text-amber-900">{stat.value}</p>
                    <p className="text-sm text-amber-700/80">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {isOwnProfile && (
              <div className="flex justify-center md:justify-end">
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="bg-white/80 border-amber-400 text-amber-700 hover:bg-white hover:text-amber-800 hover:border-amber-500 transition-all shadow-sm"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-amber-50 border-amber-400 rounded-lg">
                    <DialogHeader>
                      <DialogTitle className="font-cinzel text-2xl text-amber-900">
                        Edit Your Profile
                      </DialogTitle>
                      <DialogDescription className="text-amber-800/80">
                        Update your profile information and preferences
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-6">
                          <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-medium text-amber-900">Full Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Your name" 
                                    className="border-amber-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage className="text-rose-600" />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="bio"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-medium text-amber-900">Bio</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Tell us about yourself..." 
                                    className="h-32 border-amber-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage className="text-rose-600" />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="avatar"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-medium text-amber-900">Profile Photo</FormLabel>
                                <FormControl>
                                  <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                      <div className="relative">
                                        <img 
                                          src={field.value || "/default-avatar.png"} 
                                          alt="Profile preview"
                                          className="h-16 w-16 rounded-full border-2 border-amber-200 object-cover"
                                        />
                                        <label 
                                          className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1 rounded-full cursor-pointer hover:bg-amber-600 transition-colors"
                                          title="Upload new photo"
                                        >
                                          <Camera className="h-3.5 w-3.5" />
                                          <input 
                                            type="file" 
                                            className="hidden" 
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            disabled={isUploading}
                                          />
                                        </label>
                                      </div>
                                      <div className="flex-1 space-y-2">
                                        <Input 
                                          placeholder="Or paste image URL" 
                                          className="border-amber-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                                          {...field}
                                        />
                                        <div className="flex gap-2">
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="destructive"
                                            onClick={handleRemovePhoto}
                                            disabled={isUploading || !field.value}
                                            className="flex items-center gap-1"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                            Delete Photo
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </FormControl>
                                <FormMessage className="text-rose-600" />
                              </FormItem>
                            )}
                          />
                      </div>
                      
                      <DialogFooter className="border-t border-amber-200 pt-4">
                        <Button 
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditOpen(false)}
                          className="border-amber-300 text-amber-700 hover:bg-amber-50"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-3">
          <Badge variant="outline" className="bg-amber-50 border-amber-500 text-brown-dark">
            <User className="h-3 w-3 mr-1" />
            {user.isAuthor ? 'Author' : 'Reader'}
          </Badge>
          
          {user.isPremium && (
            <Badge className="bg-gold-rich text-brown-dark">
              Premium Member
            </Badge>
          )}
        </div>
        
        {user.bio ? (
          <p className="mt-4 text-gray-700 line-clamp-3 max-w-2xl">{user.bio}</p>
        ) : (
          <p className="mt-4 text-gray-500 italic max-w-2xl">
            {isOwnProfile 
              ? "You haven't added a bio yet. Click 'Edit Profile' to add one." 
              : `${user.fullName} hasn't added a bio yet.`}
          </p>
        )}
      </div>
    </div>
  </div>
  );
}
