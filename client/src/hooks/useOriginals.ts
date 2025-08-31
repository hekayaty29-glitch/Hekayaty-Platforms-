import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface Character {
  id: number;
  name: string;
  portraitUrl: string;
  description: string;
}

export interface StoryWorld {
  id: number;
  title: string;
  posterUrl: string;
  description: string;
  soundtrackUrl?: string;
  mapImageUrl?: string;
  characters: Character[];
}

/**
 * Fetch a published story world by numeric id.
 * Requires no auth. Returns null if not found.
 */
export function useStoryWorld(id: number | string | undefined): UseQueryResult<StoryWorld | null> {
  return useQuery<StoryWorld | null>({
    queryKey: ["/api/originals/" + id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const res = await apiRequest("GET", "/api/originals/" + id);
      if (res.status === 404) return null;
      return (await res.json()) as StoryWorld;
    },
  });
}
