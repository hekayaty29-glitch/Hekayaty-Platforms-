import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Info, Loader2 } from "lucide-react";
import { Genre } from "@/lib/types";

// Create a schema for the story form
const storyFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be 100 characters or less"),
  description: z.string().min(20, "Description must be at least 20 characters").max(500, "Description must be 500 characters or less"),
  content: z.string().min(100, "Story content must be at least 100 characters"),
  coverImage: z.string().url("Please enter a valid image URL").or(z.string().length(0)),
  isPremium: z.boolean().default(false),
  isShortStory: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  genreIds: z.array(z.number()).min(1, "At least one genre is required"),
  workshopId: z.string().uuid().optional(),
});

type StoryFormValues = z.infer<typeof storyFormSchema>;

interface PublishStoryFormProps {
  isPremium: boolean;
}

export function PublishStoryForm({ isPremium }: PublishStoryFormProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [wordCount, setWordCount] = useState(0);
  
  // Fetch genres for selection
  const { data: genres, isLoading: genresLoading } = useQuery<Genre[]>({
    queryKey: ["/api/genres"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Create form with validation
  const form = useForm<StoryFormValues>({
    resolver: zodResolver(storyFormSchema),
    defaultValues: {
      title: "",
      description: "",
      content: "",
      coverImage: "",
      isPremium: false,
      isShortStory: false,
      isPublished: false,
      workshopId: undefined,
      genreIds: [],
    },
  });
  
  // Watch content field for word count
  const content = form.watch("content");
  useEffect(() => {
    if (content) {
      const words = content.trim().split(/\s+/);
      setWordCount(words.length);
    } else {
      setWordCount(0);
    }
  }, [content]);
  
  // Watch isShortStory field for warnings
  const isShortStory = form.watch("isShortStory");
  
  // Submit story mutation
  // Fetch workshops for dropdown
  const { data: workshops } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/community/workshops", { mine: 1 }],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/community/workshops?mine=1");
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const publishMutation = useMutation({
    mutationFn: async (data: StoryFormValues) => {
      const res = await apiRequest("POST", "/api/stories", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      toast({
        title: "Story published successfully!",
        description: form.getValues("isPublished") 
          ? "Your story is now live for readers to enjoy."
          : "Your story has been saved as a draft.",
      });
      navigate(`/story/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Publishing failed",
        description: error.message || "There was an error publishing your story. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handle genre selection
  const handleGenreSelect = (genreId: number) => {
    const updatedGenres = selectedGenres.includes(genreId)
      ? selectedGenres.filter(id => id !== genreId)
      : [...selectedGenres, genreId];
    
    setSelectedGenres(updatedGenres);
    form.setValue("genreIds", updatedGenres);
  };
  
  // Handle form submission
  const onSubmit = (values: StoryFormValues) => {
    publishMutation.mutate(values);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="border-amber-500/30 bg-amber-50/60">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-cinzel text-brown-dark text-lg">Story Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter a captivating title for your story" 
                          className="border-amber-500/50 focus:border-amber-500 text-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-cinzel text-brown-dark text-lg">Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Provide a compelling description to attract readers..." 
                          className="min-h-[120px] border-amber-500/50 focus:border-amber-500"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        A brief synopsis of your story (max 500 characters).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="coverImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-cinzel text-brown-dark text-lg">Cover Image URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/cover-image.jpg" 
                        className="border-amber-500/50 focus:border-amber-500"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a URL to an image for your story cover.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div>
                <FormLabel className="font-cinzel text-brown-dark text-lg">Genres</FormLabel>
                {genresLoading ? (
                  <div className="flex items-center justify-center h-24 border rounded-md border-amber-500/50 bg-amber-50/30">
                    <Loader2 className="h-6 w-6 text-amber-500 animate-spin" />
                  </div>
                ) : genres?.length ? (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {genres.map((genre) => (
                      <div key={genre.id} className="flex items-center">
                        <Checkbox
                          id={`genre-${genre.id}`}
                          checked={selectedGenres.includes(genre.id)}
                          onCheckedChange={() => handleGenreSelect(genre.id)}
                          className="border-amber-500 data-[state=checked]:bg-amber-500"
                        />
                        <label
                          htmlFor={`genre-${genre.id}`}
                          className="ml-2 text-sm font-medium text-gray-700 cursor-pointer"
                        >
                          {genre.name}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-amber-800 p-3 bg-amber-50 rounded-md border border-amber-200 text-sm">
                    No genres available.
                  </div>
                )}
                {form.formState.errors.genreIds && (
                  <p className="text-sm font-medium text-red-500 mt-2">
                    {form.formState.errors.genreIds.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-amber-500/30 bg-amber-50/60">
          <CardContent className="pt-6">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-cinzel text-brown-dark text-lg">Story Content</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Begin your story here..." 
                      className="min-h-[400px] editor-container font-cormorant text-lg"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between">
                    <FormDescription>
                      Write your story content, using line breaks for paragraphs.
                    </FormDescription>
                    <span className="text-sm text-gray-500">
                      {wordCount} words
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        
        <Card className="border-amber-500/30 bg-amber-50/60">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="font-cinzel text-lg text-brown-dark">Publishing Options</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isShortStory"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 border p-4 rounded-md border-amber-500/30">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="border-amber-500 data-[state=checked]:bg-amber-500"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-cinzel">Short Story</FormLabel>
                        <FormDescription>
                          Categorize this as a short story rather than a full novel.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isPremium"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 border p-4 rounded-md border-amber-500/30">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!isPremium}
                          className="border-amber-500 data-[state=checked]:bg-amber-500"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-cinzel">Premium Content</FormLabel>
                        <FormDescription>
                          {isPremium 
                            ? "Mark this story as premium content for subscribers only."
                            : "Upgrade to premium to publish exclusive content."}
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              {!isPremium && (
                <div className="flex p-4 bg-amber-50 border-amber-200 border rounded-md">
                  <Info className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p>With a free account, you are limited to publishing 1 novel and 1 short story.</p>
                    <a href="/upgrade" className="text-amber-500 hover:text-amber-700 font-medium">Upgrade to premium</a> to publish unlimited stories.
                  </div>
                </div>
              )}
              
              {isShortStory && wordCount > 7500 && (
                <div className="flex p-4 bg-amber-50 border-amber-200 border rounded-md">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p>Your story is quite long for a short story (over 7,500 words). Consider marking it as a novel instead.</p>
                  </div>
                </div>
              )}
              
              {!isShortStory && wordCount < 7500 && wordCount > 0 && (
                <div className="flex p-4 bg-amber-50 border-amber-200 border rounded-md">
                  <Info className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p>Your story is quite short for a novel (under 7,500 words). Consider marking it as a short story instead.</p>
                  </div>
                </div>
              )}
              
              <FormField
                control={form.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 border p-4 rounded-md border-amber-500/30 bg-amber-50">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="border-amber-500 data-[state=checked]:bg-amber-500"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-cinzel">Publish Immediately</FormLabel>
                      <FormDescription>
                        If checked, your story will be published and visible to others. Otherwise, it will be saved as a draft.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            className="border-amber-500 text-brown-dark"
            onClick={() => navigate("/")}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            className="bg-amber-500 hover:bg-amber-600 text-white font-cinzel"
            disabled={publishMutation.isPending}
          >
            {publishMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publishing...
              </>
            ) : form.getValues("isPublished") ? (
              "Publish Story"
            ) : (
              "Save as Draft"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
