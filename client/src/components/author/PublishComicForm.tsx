import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Validation schema
const comicFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().min(20, "Description must be at least 20 characters").max(500),
  pdfUrl: z.string().url("Enter a valid PDF URL").or(z.literal("").transform(() => undefined)).optional(),
  coverImage: z.string().url("Enter a valid image URL").or(z.literal("").transform(() => undefined)).optional(),
  isPremium: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  workshopId: z.string().uuid().optional()
});

type ComicFormValues = z.infer<typeof comicFormSchema>;

interface Workshop { id: string; name: string; }

interface PublishComicFormProps {
  isPremium: boolean;
}

export default function PublishComicForm({ isPremium }: PublishComicFormProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const form = useForm<ComicFormValues>({
    resolver: zodResolver(comicFormSchema),
    defaultValues: {
      title: "",
      description: "",
      pdfUrl: "",
      coverImage: "",
      isPremium: false,
      isPublished: false,
      workshopId: undefined
    }
  });

  // fetch workshops
  const { data: workshops } = useQuery<Workshop[]>({
    queryKey: ["/api/community/workshops", { mine: 1 }],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/community/workshops?mine=1");
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const publishMutation = useMutation({
    mutationFn: async (data: ComicFormValues) => {
      const res = await apiRequest("POST", "/api/comics", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/comics"] });
      toast({ title: "Comic published successfully!" });
      navigate(`/story/${data.id}`);
    },
    onError: (err: Error) => {
      toast({ title: "Publishing failed", description: err.message, variant: "destructive" });
    }
  });

  const onSubmit = (values: ComicFormValues) => publishMutation.mutate(values);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="border-amber-500/30 bg-amber-50/60">
          <CardContent className="pt-6 space-y-6">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel className="font-cinzel text-brown-dark text-lg">Comic Title</FormLabel>
                <FormControl><Input placeholder="Enter title" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel className="font-cinzel text-brown-dark text-lg">Description</FormLabel>
                <FormControl><Textarea placeholder="Describe your comic..." className="min-h-[120px]" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="pdfUrl" render={({ field }) => (
              <FormItem>
                <FormLabel className="font-cinzel text-brown-dark text-lg">PDF URL</FormLabel>
                <FormControl><Input placeholder="https://example.com/comic.pdf" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="coverImage" render={({ field }) => (
              <FormItem>
                <FormLabel className="font-cinzel text-brown-dark text-lg">Cover Image URL</FormLabel>
                <FormControl><Input placeholder="https://example.com/cover.jpg" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="isPremium" render={({ field }) => (
                <FormItem className="flex items-start space-x-3 border p-4 rounded-md border-amber-500/30">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={!isPremium} className="border-amber-500 data-[state=checked]:bg-amber-500" /></FormControl>
                  <FormLabel className="font-cinzel">Premium Content</FormLabel>
                </FormItem>
              )} />

              <FormField control={form.control} name="isPublished" render={({ field }) => (
                <FormItem className="flex items-start space-x-3 border p-4 rounded-md border-amber-500/30">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="border-amber-500 data-[state=checked]:bg-amber-500" /></FormControl>
                  <FormLabel className="font-cinzel">Publish Immediately</FormLabel>
                </FormItem>
              )} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate("/")} className="border-amber-500 text-brown-dark">Cancel</Button>
          <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white font-cinzel" disabled={publishMutation.isPending}>
            {publishMutation.isPending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Publishing...</>) : (form.getValues("isPublished") ? "Publish Comic" : "Save Draft")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
