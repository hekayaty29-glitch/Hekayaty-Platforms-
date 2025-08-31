import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface ChapterSummary {
  id: number;
  title: string;
  summary: string;
  coverUrl: string;
  unlocked: boolean;
}

export function useStoryChapters(storyId: number | string | undefined) {
  return useQuery<ChapterSummary[]>({
    queryKey: ["/api/originals/" + storyId + "/chapters"],
    enabled: !!storyId,
    queryFn: async () => {
      if (!storyId) return [];
      const res = await apiRequest("GET", `/api/originals/${storyId}/chapters`);
      return (await res.json()) as ChapterSummary[];
    },
  });
}
