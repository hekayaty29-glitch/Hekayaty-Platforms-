import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface Creator {
  id: string;
  username: string;
  avatar: string;
}

export function useCreatorSpotlight() {
  const queryClient = useQueryClient();

  const { data: fetchedCreators = [], isLoading } = useQuery<Creator[]>({
    queryKey: ["top-creators"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/creators/top");
      const raw = await res.json();
      return raw.map((c: any) => ({ id: c.id, username: c.username, avatar: c.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${c.username}` }));
    },
    staleTime: 5 * 60 * 1000,
  });

  const addCreator = (creator: Creator) => {
    // TODO: Implement backend API call
    console.log('Add creator:', creator);
  };

  const updateCreator = (id: string, data: Partial<Creator>) => {
    // TODO: Implement backend API call
    console.log('Update creator:', id, data);
  };

  const deleteCreator = (id: string) => {
    // TODO: Implement backend API call
    console.log('Delete creator:', id);
  };

  return { creators: fetchedCreators, isLoading, addCreator, updateCreator, deleteCreator, refetch: () => queryClient.invalidateQueries({ queryKey: ["top-creators"] }) };
}
