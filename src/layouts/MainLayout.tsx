/**
 * Main Layout Component
 * =====================
 * Shared layout wrapper for all pages in the application.
 * Provides consistent header, navigation, and page structure.
 * 
 * @architecture Clean Architecture - Presentation Layer
 * @patterns Composition, Container/Presentational
 */

import React, { ReactNode } from "react";

import { AppHeader } from "../components/vnpay/AppHeader";

export type PageView = "main" | "manage" | "test" | "debug";

interface MainLayoutProps {
  /** Child components to render in the main content area */
  children: ReactNode;
  
  /** Current active page for navigation highlighting */
  currentPage: PageView;
  
  /** Callback for page navigation */
  onNavigate: (page: PageView) => void;
  
  /** Whether running in localhost development mode */
  isLocalHost: boolean;
  
  /** Optional custom page title for SEO */
  pageTitle?: string;
}

/**
 * MainLayout - Shared layout structure for all pages
 * 
 * Structure:
 * - Header (sticky, always visible)
 * - Main content area (scrollable)
 * - Footer (optional, can be added later)
 * 
 * @example
 * ```tsx
 * <MainLayout
 *   currentPage="test"
 *   onNavigate={handleNavigate}
 *   isLocalHost={true}
 * >
 *   <YourPageContent />
 * </MainLayout>
 * ```
 */
export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  currentPage,
  onNavigate,
  isLocalHost,
  pageTitle = "VNPay Integration",
}) => {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f8fafc",
      }}
    >
      {/* Global Styles */}
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
            'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
            'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        /* Scrollbar Styling */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>

      {/* Header */}
      <AppHeader
        currentPage={currentPage}
        onNavigate={onNavigate}
        isLocalHost={isLocalHost}
      />

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </main>

      {/* Footer (optional, can be added later) */}
      {/* <Footer /> */}
    </div>
  );
};
