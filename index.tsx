import { createRoot } from 'react-dom/client';
import App from './App';
import './src/index.css';
import ToastProvider from './src/components/ToastProvider';
import { ClerkProvider } from '@clerk/clerk-react';
import { ChipiProvider } from '@chipi-stack/chipi-react';

const container = document.getElementById('root');

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const CHIPI_API_KEY = import.meta.env.VITE_CHIPI_API_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key for Clerk. Please set VITE_CLERK_PUBLISHABLE_KEY in your .env file.");
}

if (!CHIPI_API_KEY) {
  throw new Error("Missing Chipi API Key. Please set VITE_CHIPI_API_KEY in your .env file.");
}

// DEBUG: Log the API key to verify its value at runtime
console.log("DEBUG: CHIPI_API_KEY value:", CHIPI_API_KEY);

if (container) {
  const root = createRoot(container);
  root.render(
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <ChipiProvider config={{ apiPublicKey: CHIPI_API_KEY }}> {/* Corregido: Pasar la clave API dentro de un objeto 'config' */}
        <ToastProvider />
        <App />
      </ChipiProvider>
    </ClerkProvider>
  );
}