import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// A missing config shouldn't crash the whole app at import time — pages
// still need to render so the rest of the dashboard is usable. mapApi.js /
// useMapData.js catch the resulting request failures and fall back to demo
// data (see LiveMapView's "Demo Mode" banner).
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set. ' +
      'Copy .env.example to .env.local and fill them in to enable live data. ' +
      'The app will run in demo/offline mode until then.'
  );
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '');
