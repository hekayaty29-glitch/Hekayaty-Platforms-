import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface NewsItem {
  id: string;
  type: "main" | "community";
  title: string;
  content: string;
  created_at: string;
}

export function useNews(type: "main" | "community" = "main") {
  return useQuery<NewsItem[]>({
    queryKey: ["news", type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("id, type, title, content, created_at")
        .eq("type", type)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as NewsItem[];
    },
    staleTime: 1000 * 60 * 5,
  });
}
