// Type definitions for Deno Edge Functions

declare namespace Deno {
  export namespace env {
    export function get(key: string): string | undefined;
  }
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export { createClient } from "@supabase/supabase-js";
  export type { SupabaseClient } from "@supabase/supabase-js";
}

declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (request: Request) => Response | Promise<Response>): void;
}
