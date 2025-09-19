import { createClient } from "@supabase/supabase-js";

export const SUPABASE_BUCKET =
  (import.meta as any).env?.VITE_SUPABASE_BUCKET || "machines-images";

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string;
const supabaseAnonKey = (import.meta as any).env
  ?.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.error("Faltan variables VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getPublicUrl(path: string) {
  const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export default supabase;
