import { createRoot } from 'react-dom/client';
import App from './App';
import './src/index.css';
import { AuthProvider } from './src/components/AuthProvider';
import ToastProvider from './src/components/ToastProvider'; // Importar ToastProvider

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  root.render(
    <AuthProvider>
      <ToastProvider /> {/* Añadir ToastProvider aquí */}
      <App />
    </AuthProvider>
  );
}