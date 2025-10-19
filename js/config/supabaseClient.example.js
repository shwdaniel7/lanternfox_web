import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = ''; // Cole sua URL aqui
const SUPABASE_ANON_KEY = ''; // Cole sua Chave Anônima aqui

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);