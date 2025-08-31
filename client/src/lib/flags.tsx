import React, { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";

export type Flags = Record<string, boolean>;

const FlagsContext = createContext<Flags>({});

export function FlagsProvider({ children }: { children: React.ReactNode }) {
  const { data } = useQuery<Flags>({
    queryKey: ["flags"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/flags");
        if (!res.ok) throw new Error("Failed to fetch flags");
        return res.json();
      } catch {
        return {};
      }
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    initialData: {},
  });

  return <FlagsContext.Provider value={data || {}}>{children}</FlagsContext.Provider>;
}

export function useFlags() {
  return useContext(FlagsContext);
}

export function useFlag(key: string) {
  const flags = useFlags();
  return !!flags[key];
}
