/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
  // Añade aquí otras variables de entorno que uses con el prefijo VITE_
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}