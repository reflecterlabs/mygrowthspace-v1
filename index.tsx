import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './src/index.css';
import { AuthProvider } from './src/components/AuthProvider';

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </React.StrictMode>
  );
}