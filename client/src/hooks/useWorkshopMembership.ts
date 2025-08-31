import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const membersKey = (workshopId: number, approved: boolean) => ["workshop-members", workshopId, approved ? "approved" : "pending"];

export function useWorkshopMembers(workshopId: number) {
  return useQuery<string[]>({
    queryKey: membersKey(workshopId, true),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workshop_members")
        .select("user_id")
        .eq("workshop_id", workshopId)
        .eq("approved", true);
      if (error) throw error;
      return data.map((row) => row.user_id);
    },
  });
}

export function usePendingWorkshopMembers(workshopId: number) {
  return useQuery<string[]>({
    queryKey: membersKey(workshopId, false),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workshop_members")
        .select("user_id")
        .eq("workshop_id", workshopId)
        .eq("approved", false);
      if (error) throw error;
      return data.map((row) => row.user_id);
    },
  });
}

export function useRequestJoinWorkshop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ workshopId, userId }: { workshopId: number; userId: string }) => {
      const { error } = await supabase
        .from("workshop_members")
        .insert({ workshop_id: workshopId, user_id: userId, approved: false });
      if (error && error.code !== "23505") throw error;
    },
    onSuccess: (_, { workshopId }) => {
      qc.invalidateQueries({ queryKey: membersKey(workshopId, false) });
    },
  });
}

export function useApproveWorkshopMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ workshopId, userId }: { workshopId: number; userId: string }) => {
      const { error } = await supabase
        .from("workshop_members")
        .update({ approved: true })
        .eq("workshop_id", workshopId)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: (_, { workshopId }) => {
      qc.invalidateQueries({ queryKey: membersKey(workshopId, true) });
      qc.invalidateQueries({ queryKey: membersKey(workshopId, false) });
    },
  });
}

export function useRejectWorkshopMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ workshopId, userId }: { workshopId: number; userId: string }) => {
      const { error } = await supabase
        .from("workshop_members")
        .delete()
        .eq("workshop_id", workshopId)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: (_, { workshopId }) => {
      qc.invalidateQueries({ queryKey: membersKey(workshopId, false) });
    },
  });
}
