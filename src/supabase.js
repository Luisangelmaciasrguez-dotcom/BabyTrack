import { createClient } from "@supabase/supabase-js";

// Estas variables se configuran en Vercel (o en un archivo .env local).
// Si no existen, la app funciona igual pero solo guarda en este dispositivo.
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key) : null;
