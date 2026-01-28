/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_CLERK_PUBLISHABLE_KEY: string; // Añadido para Clerk
  readonly VITE_CHIPI_API_KEY: string; // Añadido para Chipi Pay
  // Añade aquí otras variables de entorno que uses con el prefijo VITE_
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}