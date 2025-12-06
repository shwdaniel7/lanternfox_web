import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = 'https://yijgjxbznkanpsytcpjl.supabase.co'; // Cole sua URL aqui
const SUPABASE_ANON_KEY = 'sb_publishable_uP1ivxD4Xf-J1xRxK8qCwA_PJRVtxBX';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
