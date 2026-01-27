import { createRoot } from 'react-dom/client';
import App from './App';
import './src/index.css';
import ToastProvider from './src/components/ToastProvider';
import { ClerkProvider } from '@clerk/clerk-react';
import { ChipiProvider } from '@chipi-stack/chipi-react';

const container = document.getElementById('root');

// Asegúrate de que las variables de entorno estén disponibles
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const CHIPI_API_KEY = import.meta.env.VITE_CHIPI_API_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key for Clerk. Please set VITE_CLERK_PUBLISHABLE_KEY in your .env file.");
}

if (!CHIPI_API_KEY) {
  throw new Error("Missing Chipi API Key. Please set VITE_CHIPI_API_KEY in your .env file.");
}

if (container) {
  const root = createRoot(container);
  root.render(
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <ChipiProvider apiKey={CHIPI_API_KEY}> {/* Corregido: apiKey como prop directa */}
        <ToastProvider />
        <App />
      </ChipiProvider>
    </ClerkProvider>
  );
}