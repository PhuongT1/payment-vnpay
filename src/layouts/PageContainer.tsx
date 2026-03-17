/**
 * Page Container Component
 * ========================
 * Reusable container for page content with consistent spacing and max-width.
 * Provides responsive padding and centering.
 * 
 * @architecture Clean Architecture - Presentation Layer
 * @patterns Composition
 */

import React, { CSSProperties, ReactNode } from "react";

interface PageContainerProps {
  /** Child components to render */
  children: ReactNode;
  
  /** Maximum width of the container (default: 1600px) */
  maxWidth?: number;
  
  /** Additional custom styles */
  style?: CSSProperties;
  
  /** Custom CSS class name */
  className?: string;
}

/**
 * PageContainer - Consistent content wrapper for all pages
 * 
 * Features:
 * - Responsive padding that scales with viewport
 * - Maximum width constraint for large screens
 * - Center alignment
 * - Mobile-optimized spacing
 * 
 * @example
 * ```tsx
 * <PageContainer>
 *   <h1>Page Title</h1>
 *   <p>Content goes here</p>
 * </PageContainer>
 * ```
 */
export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  maxWidth = 1600,
  style = {},
  className = "",
}) => {
  return (
    <>
      <style jsx>{`
        @media (max-width: 768px) {
          .page-container {
            padding: 32px 20px !important;
          }
        }
      `}</style>

      <div
        className={`page-container ${className}`}
        style={{
          padding: `48px max(24px, calc((100vw - ${maxWidth}px) / 2))`,
          maxWidth: `${maxWidth}px`,
          margin: "0 auto",
          width: "100%",
          ...style,
        }}
      >
        {children}
      </div>
    </>
  );
};
