<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# MyGrowth Space - AI-Powered Personal Growth Platform

A comprehensive personal growth platform powered by Google Gemini AI, designed to help users build consistent habits, track progress, and receive personalized recommendations.

**Live App:** https://mygrowth.space/  
**AI Studio:** https://ai.studio/apps/drive/1PtTbK01zynrCj3VlHphiYOEftcsjytBm

## 🎯 Features

### Core Capabilities
- **AI-Powered Habit Generation**: Google Gemini analyzes your routines and automatically creates personalized habit recommendations
- **Multi-Language Support**: Full support for Spanish, English, Portuguese, Russian, Hindi, and Chinese
- **Smart Habit Tracking**: Track daily habits with streak calculations and progress visualization
- **Intelligent Insights**: AI-powered analysis of your habit completion patterns and optimization suggestions
- **Daily Recommendations**: Personalized motivational quotes and atomic habit steps based on your focus areas
- **Routine Analysis**: Parse natural language descriptions of your routines into structured habits

### Professional Observability Stack
- **Sentry**: Real-time error tracking and performance monitoring
- **Amplitude**: Comprehensive event tracking and user behavior analytics
- **Opik**: LLM tracing and optimization for Gemini API calls (latency, tokens, quality metrics)

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- Clerk authentication account
- Supabase project
- Google Gemini API key
- (Optional) Sentry, Amplitude, and Opik accounts for observability

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables** in `.env.local`:
   ```env
   # Authentication
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key

   # Database
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_key

   # AI Model
   VITE_GEMINI_API_KEY=your_gemini_api_key

   # Payment (Chipi)
   VITE_CHIPI_API_KEY=your_chipi_key
   CHIPI_SECRET_KEY=your_chipi_secret

   # Observability (Optional)
   VITE_SENTRY_DSN=your_sentry_dsn
   VITE_AMPLITUDE_API_KEY=your_amplitude_key

   # Opik (Backend only - for Supabase Edge Functions)
   OPIK_API_KEY=your_opik_api_key
   OPIK_PROJECT_NAME=mygrowthspace
   OPIK_WORKSPACE_NAME=your_workspace
   OPIK_URL_OVERRIDE=https://www.comet.com/opik/api
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Access the app:**
   - Local: http://localhost:5173
   - Production: https://mygrowth.space/

## 📊 Observability & Metrics

### Sentry
- Tracks JavaScript errors and exceptions
- Records breadcrumbs for user actions
- Monitors API failures and performance issues

### Amplitude
- Event tracking for user engagement (feedback submission, habit creation, etc.)
- Session analytics
- User behavior segmentation

### Opik (Backend LLM Tracing)
- Integrated in Supabase Edge Function: `gemini-proxy`
- Traces all Gemini API calls with:
  - Response latency (ms)
  - Token usage metrics
  - Error tracking
  - Operation types (getDailyInspiration, generateSuggestedCards, parseRoutineIntoHabits)
  - Language and metadata tracking

**To view metrics:**
1. Configure Opik API keys in Supabase environment variables
2. Use the app to trigger Gemini calls (onboarding, daily recommendations, routine analysis)
3. View traces at: https://www.comet.com/opik/api

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite
- **UI Framework**: Tailwind CSS + Lucide Icons
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Clerk
- **AI/LLM**: Google Gemini 1.5 Flash
- **Payment**: Chipi
- **Mobile**: Capacitor (iOS & Android support)

## 📁 Project Structure

```
src/
├── components/        # Reusable UI components
├── pages/            # Page components
├── lib/              # Utilities and helpers
├── integrations/     # Third-party integrations
├── utils/            # Helper functions
└── analytics.ts      # Observability initialization

supabase/
├── functions/
│   ├── gemini-proxy/     # AI function with Opik tracing
│   └── delete-user/      # User data deletion

services/
└── geminiService.ts  # Gemini API integration
```

## 🔐 Security

- All sensitive API keys stored in environment variables
- Clerk integration for secure authentication
- Supabase RLS (Row Level Security) for data protection
- No personal data logged in observability tools

## 📱 Deployment

The app is deployed to: **https://mygrowth.space/**

For deployment to production:
1. Configure Vercel environment variables
2. Connect Supabase project
3. Set up Clerk production keys
4. Deploy via Vercel dashboard

## 🤝 Contributing

This is a proof-of-concept for Comet Hackathon.

## 📄 License

Proprietary - All rights reserved
