import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = 'https://yijgjxbznkanpsytcpjl.supabase.co'; // Cole sua URL aqui
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpamdqeGJ6bmthbnBzeXRjcGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwODM1OTIsImV4cCI6MjA3NDY1OTU5Mn0.2H2nOwA3H45Cg9rwtbZ32MgMaMuKIH2P8Qqol--rbJg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);