// src/analytics.ts
// Inicialización centralizada de Sentry y Amplitude para frontend
// Opik se ejecuta solo en backend (Supabase Edge Functions)

import * as Sentry from '@sentry/react';
import { init as amplitudeInit, track as amplitudeTrack } from '@amplitude/analytics-browser';

// Sentry
export function initSentry() {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [Sentry.browserTracingIntegration()],
      tracesSampleRate: 1.0, // Captura el 100% de las transacciones para pruebas
      environment: import.meta.env.MODE,
    });
  }
}

// Amplitude
export function initAmplitude() {
  if (import.meta.env.VITE_AMPLITUDE_API_KEY) {
    amplitudeInit(import.meta.env.VITE_AMPLITUDE_API_KEY, undefined, {
      defaultTracking: true, // Track page views, sessions, etc. automáticamente
    });
  }
}

// Función para trackear eventos con Amplitude desde cualquier componente
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (import.meta.env.VITE_AMPLITUDE_API_KEY) {
    amplitudeTrack(eventName, properties);
  }
}

// Inicialización global (solo frontend)
export function initAnalytics() {
  initSentry();
  initAmplitude();
}
