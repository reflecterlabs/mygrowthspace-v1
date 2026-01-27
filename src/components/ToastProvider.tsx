"use client";

import React from 'react';
import { Toaster } from 'react-hot-toast';

const ToastProvider: React.FC = () => {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        // Define default options
        className: '',
        duration: 3000,
        style: {
          background: '#1e293b', // slate-800
          color: '#f8fafc', // slate-50
          borderRadius: '1.5rem', // rounded-3xl
          padding: '16px 24px',
          fontSize: '14px',
          fontWeight: '600',
          border: '1px solid rgba(255, 255, 255, 0.1)', // white/10
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },
        // Default options for specific types
        success: {
          iconTheme: {
            primary: '#06b6d4', // cyan-500
            secondary: '#f8fafc', // slate-50
          },
          style: {
            border: '1px solid rgba(6, 182, 212, 0.3)', // cyan-500/30
          }
        },
        error: {
          iconTheme: {
            primary: '#ef4444', // red-500
            secondary: '#f8fafc', // slate-50
          },
          style: {
            border: '1px solid rgba(239, 68, 68, 0.3)', // red-500/30
          }
        },
        loading: {
          iconTheme: {
            primary: '#f97316', // orange-500
            secondary: '#f8fafc', // slate-50
          },
          style: {
            border: '1px solid rgba(249, 115, 22, 0.3)', // orange-500/30
          }
        }
      }}
    />
  );
};

export default ToastProvider;