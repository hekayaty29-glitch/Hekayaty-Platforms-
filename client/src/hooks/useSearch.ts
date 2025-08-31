import { useQuery } from '@tanstack/react-query';

/** Generic search hook for stories or comics. */
function useSearch<T>(type: 'stories' | 'comics', query: string, enabled = true) {
  return useQuery<T[]>({
    queryKey: ['search', type, query],
    enabled: enabled && query.length > 1,
    queryFn: async () => {
      const res = await fetch(`/api/public/search/${type}?q=` + encodeURIComponent(query));
      if (!res.ok) throw new Error('Failed to search ' + type);
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}

export function useSearchStories(query: string, enabled = true) {
  return useSearch<{ id: string; title: string; cover: string; author: string }>('stories', query, enabled);
}

export function useSearchComics(query: string, enabled = true) {
  return useSearch<{ id: string; title: string; cover: string }>('comics', query, enabled);
}
