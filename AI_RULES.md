# AI Rules for My Growth Space Application

This document outlines the core technologies and libraries used in the "My Growth Space" application, along with guidelines for their appropriate use.

## Tech Stack Overview

1.  **React**: The primary JavaScript library for building the user interface.
2.  **TypeScript**: Used for type safety across the entire codebase, enhancing code quality and maintainability.
3.  **Tailwind CSS**: A utility-first CSS framework for styling all components, ensuring a consistent and responsive design.
4.  **Vite**: The build tool and development server, providing a fast development experience.
5.  **Google Gemini API**: Integrated for AI-driven functionalities such as routine analysis, habit suggestions, and generating identity statements.
6.  **Lucide React**: A collection of beautiful and customizable open-source icons, used throughout the application.
7.  **Recharts**: A composable charting library built with React and D3, used for data visualization (e.g., habit progress charts).
8.  **Local Storage**: Utilized for client-side data persistence, storing user profiles and habits locally.
9.  **Progressive Web App (PWA)**: The application is configured with a service worker and manifest for offline capabilities and installability.
10. **shadcn/ui**: A collection of re-usable components built with Radix UI and Tailwind CSS, available for building UI elements.

## Library Usage Rules

*   **React**: All UI components must be built using React.
*   **TypeScript**: All new and modified JavaScript files should use TypeScript (`.ts` or `.tsx` extensions).
*   **Tailwind CSS**: All styling must be implemented using Tailwind CSS classes. Avoid writing custom CSS files or inline styles unless absolutely necessary for dynamic values.
*   **Google Gemini API**: Use the `@google/genai` package for all AI-related interactions, including habit analysis, routine parsing, and suggested cards.
*   **Lucide React**: Use icons from `lucide-react` for all graphical symbols in the UI.
*   **Recharts**: For any data visualization or charting requirements, `recharts` should be the go-to library.
*   **Local Storage**: For client-side data persistence, use `localStorage`. Do not introduce other client-side storage solutions without explicit approval.
*   **React Router**: For managing navigation and routes within the application, `react-router-dom` should be used. All routes should be defined in `src/App.tsx`.
*   **shadcn/ui**: Prioritize using components from `shadcn/ui` for common UI elements (e.g., buttons, forms, dialogs) to maintain consistency and leverage pre-built accessibility features. If a `shadcn/ui` component doesn't fit, create a new custom component.