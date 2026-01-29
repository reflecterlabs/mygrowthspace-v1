"use client";

import React, { useState, useRef, useEffect } from 'react';
import * as Sentry from '@sentry/react';
import { trackEvent } from '../analytics';
import { Send, X, MessageSquare } from 'lucide-react';

interface FeedbackBubbleProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string) => Promise<void>;
  language?: string;
}

const FeedbackBubble: React.FC<FeedbackBubbleProps> = ({ isOpen, onClose, onSubmit, language = 'en' }) => {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleSubmit = async () => {
    if (!text.trim() || isSubmitting) return;
    setIsSubmitting(true);

    // Trackear evento en Amplitude
    trackEvent('feedback_submitted', { textLength: text.length, language });

    try {
      await onSubmit(text);
      // --- Sentry (breadcrumb de éxito) ---
      Sentry.addBreadcrumb({
        category: 'feedback',
        message: 'Feedback enviado correctamente',
        level: 'info',
        data: { textLength: text.length, language },
      });
    } catch (error) {
      // --- Sentry (error) ---
      Sentry.captureException(error);
      throw error;
    } finally {
      setText('');
      setIsSubmitting(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={containerRef}
      className="absolute top-20 right-6 w-72 bg-[#1a1a1e] border border-white/10 rounded-3xl p-4 shadow-2xl z-50 animate-in zoom-in-95 duration-200"
    >
      <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
        <div className="flex items-center gap-2 text-primary-500">
          <MessageSquare size={14} />
          <span className="text-[10px] font-black uppercase tracking-widest">Feedback</span>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>
      
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={language === 'es' ? "¿Cómo podemos mejorar tu espacio?" : "How can we improve your growth space?"}
        className="w-full bg-white/5 border border-white/5 rounded-2xl p-3 text-sm text-white placeholder:text-slate-600 outline-none resize-none h-24 mb-3 font-medium"
      />
      
      <button
        onClick={handleSubmit}
        disabled={!text.trim() || isSubmitting}
        className="w-full bg-primary-500 text-black rounded-xl py-3 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-20"
      >
        <Send size={14} />
        <span>{language === 'es' ? "Enviar Feedback" : "Send Feedback"}</span>
      </button>
    </div>
  );
};

export default FeedbackBubble;