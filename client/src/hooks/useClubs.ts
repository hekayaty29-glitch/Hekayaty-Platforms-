import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Club {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  founder_id: string;
  created_at: string;
  members: string[]; // user ids
}

export interface ClubMessage {
  id: string;
  club_id: number;
  user_id: string;
  text: string;
  created_at: string;
}

/* ------------ helpers ------------- */
const clubsKey = ["clubs"];
const clubKey = (id: string | undefined) => ["club", id];

/* ------------ hooks ------------- */
export function useClubs() {
  return useQuery<Club[]>({
    queryKey: clubsKey,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_clubs_with_members");
      if (error) throw error;
      return data as Club[];
    },
  });
}

export function useClub(id: string | undefined) {
  return useQuery<Club & { messages: ClubMessage[] }>({
    enabled: !!id,
    queryKey: clubKey(id),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_club_detail", { p_club_id: id });
      if (error) throw error;
      return data as any;
    },
  });
}

export function useJoinClub() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clubId, userId }: { clubId: string; userId: string }) => {
      const { error } = await supabase.from("club_memberships").insert({ club_id: clubId, user_id: userId });
      if (error && error.code !== "23505") throw error; // ignore duplicate
    },
    onSuccess: (_, { clubId }) => {
      qc.invalidateQueries({ queryKey: clubKey(clubId) });
      qc.invalidateQueries({ queryKey: clubsKey });
    },
  });
}

export function useSendClubMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clubId, userId, text }: { clubId: string; userId: string; text: string }) => {
      const { error } = await supabase.from("club_messages").insert({ club_id: clubId, user_id: userId, text });
      if (error) throw error;
    },
    onSuccess: (_, { clubId }) => {
      qc.invalidateQueries({ queryKey: clubKey(clubId) });
    },
  });
}

export function useAddClub() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, description, founderId }: { name: string; description?: string; founderId: string }) => {
      const { data, error } = await supabase
        .from("clubs")
        .insert({ name, description: description ?? null, creator_id: founderId })
        .select("id").single();
      if (error) throw error;
      // auto-enroll creator as admin member
      await supabase.from("club_memberships").insert({ club_id: data.id, user_id: founderId, role: "admin" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clubsKey });
    },
  });
}

export function useUpdateClubLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clubId, url }: { clubId: string; url: string }) => {
      const { error } = await supabase.from("clubs").update({ logo_url: url }).eq("id", clubId);
      if (error) throw error;
    },
    onSuccess: (_, { clubId }) => {
      qc.invalidateQueries({ queryKey: clubKey(clubId) });
      qc.invalidateQueries({ queryKey: clubsKey });
    },
  });
}
