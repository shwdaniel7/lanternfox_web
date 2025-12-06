import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = 'https://yijgjxbznkanpsytcpjl.supabase.co'; // Cole sua URL aqui
const SUPABASE_ANON_KEY = 'sb_secret_L4dbtUrkVBFC7ZakLLC-Uw_Vdo6bg-r';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
