import { Link } from 'wouter';
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Comic {
  id: string;
  title: string;
  cover: string;
  author_id?: string;
  author?: {
    id: string;
    fullName: string;
  };
}

interface Props {
  comic: Comic;
  onDelete?: () => void;
}

export default function ComicCard({ comic, onDelete }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if current user is the author
  const isOwner = user && (
    comic.author_id?.toString() === user.id?.toString() || 
    comic.author?.id?.toString() === user.id?.toString()
  );

  const deleteComicMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/comics/${comic.id}`);
      if (!response.ok) {
        throw new Error('Failed to delete comic');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Comic deleted",
        description: "Your comic has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['comics'] });
      onDelete?.();
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to delete comic. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    deleteComicMutation.mutate();
  };

  return (
    <div className="relative group bg-amber-50/10 rounded-lg overflow-hidden border border-amber-500 hover:shadow-lg transition-shadow">
      <Link href={`/comic/${comic.id}`} className="block">
        <img src={comic.cover} alt={comic.title} className="w-full h-48 object-cover group-hover:opacity-90 transition-opacity" />
        <div className="p-4">
          <h3 className="font-cinzel text-lg font-bold text-amber-50 mb-1 truncate group-hover:text-amber-300 transition-colors">
            {comic.title}
          </h3>
        </div>
      </Link>
      
      {/* Delete button for comic owners */}
      {isOwner && (
        <div className="absolute top-2 right-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="h-8 w-8 p-0 bg-red-500/80 hover:bg-red-600 backdrop-blur-sm"
                onClick={(e) => e.preventDefault()}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Comic</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{comic.title}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={deleteComicMutation.isPending}
                >
                  {deleteComicMutation.isPending ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
