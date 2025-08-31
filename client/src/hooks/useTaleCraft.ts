import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface StoryProjectLite {
  id: string;
  title: string;
  chapters: unknown[];
  lastModified: string;
}

const storyProjectsKey = ["story-projects"];
const comicProjectsKey = ["comic-projects"];
const photoProjectsKey = ["photo-projects"];

export function useStoryProjects() {
  return useQuery<StoryProjectLite[]>({
    queryKey: storyProjectsKey,
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/talecraft/story-projects");
      return res.json();
    },
  });
}

export function useCreateStoryProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { title: string }) => {
      const res = await apiRequest("POST", "/api/talecraft/story-projects", payload);
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: storyProjectsKey }),
  });
}

export function useUpdateStoryProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; data: unknown }) => {
      await apiRequest("PATCH", `/api/talecraft/story-projects/${payload.id}`, payload.data);
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: storyProjectsKey });
    },
  });
}

export function useDeleteStoryProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/talecraft/story-projects/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: storyProjectsKey }),
  });
}

// COMIC PROJECT HOOKS
export interface ComicProjectLite {
  id: string;
  title: string;
  pages: unknown[];
  lastModified: string;
}

export function useComicProjects() {
  return useQuery<ComicProjectLite[]>({
    queryKey: comicProjectsKey,
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/talecraft/comic-projects");
      return res.json();
    },
  });
}

export function useCreateComicProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { title: string }) => {
      const res = await apiRequest("POST", "/api/talecraft/comic-projects", payload);
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: comicProjectsKey }),
  });
}

export function useUpdateComicProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; data: unknown }) => {
      await apiRequest("PATCH", `/api/talecraft/comic-projects/${payload.id}`, payload.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: comicProjectsKey }),
  });
}

export function useDeleteComicProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/talecraft/comic-projects/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: comicProjectsKey }),
  });
}

// PHOTO PROJECT HOOKS
export interface PhotoProjectLite {
  id: string;
  title: string;
  pages: unknown[];
  lastModified: string;
}

export function usePhotoProjects() {
  return useQuery<PhotoProjectLite[]>({
    queryKey: photoProjectsKey,
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/talecraft/photo-projects");
      return res.json();
    },
  });
}

export function useCreatePhotoProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { title: string }) => {
      const res = await apiRequest("POST", "/api/talecraft/photo-projects", payload);
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: photoProjectsKey }),
  });
}

export function useUpdatePhotoProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; data: unknown }) => {
      await apiRequest("PATCH", `/api/talecraft/photo-projects/${payload.id}`, payload.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: photoProjectsKey }),
  });
}

export function useDeletePhotoProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/talecraft/photo-projects/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: photoProjectsKey }),
  });
}
