import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase } from "./supabase";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Default to local backend if env not set
const API_BASE: string = (import.meta.env.VITE_API_BASE as string | undefined) || "http://localhost:5000";

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  console.log('Session debug:', { session: !!session, token: session?.access_token ? 'present' : 'missing' });
  
  const hdrs: Record<string,string> = {};
  
  // Only set Content-Type for JSON data, not FormData
  if (data && !(data instanceof FormData)) {
    hdrs["Content-Type"] = "application/json";
  }
  
  if (session?.access_token) {
    hdrs["Authorization"] = `Bearer ${session.access_token}`;
    console.log('Added Authorization header');
  } else {
    console.log('No access token found - attempting to refresh session');
    // Try to refresh the session
    const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
    if (refreshedSession?.access_token) {
      hdrs["Authorization"] = `Bearer ${refreshedSession.access_token}`;
      console.log('Added Authorization header from refreshed session');
    } else {
      console.log('Failed to refresh session - user may need to log in again');
    }
  }

  const finalUrl = url.startsWith("http") ? url : `${API_BASE}${url}`;

  const res = await fetch(finalUrl, {
    method,
    headers: hdrs,
    body: data ? (data instanceof FormData ? data : JSON.stringify(data)) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const raw = queryKey[0] as string;
    const finalUrl = raw.startsWith("http") ? raw : `${API_BASE}${raw}`;
    const { data: { session } } = await supabase.auth.getSession();
    const hdrs: Record<string,string> = {};
    if (session?.access_token) {
      hdrs["Authorization"] = `Bearer ${session.access_token}`;
    }
    
    const res = await fetch(finalUrl, {
      credentials: "include",
      headers: hdrs,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
