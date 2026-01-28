import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://dtyzunvgbmnheqbubhef.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0eXp1bnZnYm1uaGVxYnViaGVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NzUyNTQsImV4cCI6MjA4NDM1MTI1NH0.M89K2IMTLhx5puWJd5FCQqipqE3qiBHm7p9s6VE6AOQ";

// Esta función creará un cliente configurado para usar el token de Clerk dinámicamente
export const createClerkSupabaseClient = (getToken: any) => {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      fetch: async (url, options = {}) => {
        const token = await getToken(); // Obtiene el token de sesión por defecto de Clerk
        const headers = new Headers(options.headers);
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        return fetch(url, { ...options, headers });
      },
    },
  });
};