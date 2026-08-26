import { supabase } from "@/integrations/supabase/client";

const BUCKET = "evidencias";

/** Envia um arquivo para o bucket privado e devolve o path interno. */
export async function uploadEvidencia(file: File, pasta: string): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${pasta}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}

/** Gera URL assinada temporária (arquivos nunca são públicos). */
export async function signedUrl(path: string, seconds = 3600): Promise<string | null> {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, seconds);
  return data?.signedUrl ?? null;
}
