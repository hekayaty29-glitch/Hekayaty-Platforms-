import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface ChapterPage {
  id: number;
  content: string;
  bannerUrl: string;
  audioUrl: string;
  nextPage?: number;
  prevPage?: number;
}

export function useChapterPage(storyId: number | string | undefined, chapterId: number | string | undefined, pageNum: number | string | undefined) {
  return useQuery<ChapterPage | null>({
    queryKey: ["/api/originals", storyId, "chapters", chapterId, "pages", pageNum],
    enabled: !!storyId && !!chapterId && !!pageNum,
    queryFn: async () => {
      if (!storyId || !chapterId || !pageNum) return null;
      const res = await apiRequest("GET", `/api/originals/${storyId}/chapters/${chapterId}/pages/${pageNum}`);
      if (res.status === 404) return null;
      return (await res.json()) as ChapterPage;
    }
  });
}
