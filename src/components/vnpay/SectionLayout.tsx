/**
 * Section Layout Component
 * Reusable two-column layout for configuration sections
 */

import React from "react";

interface SectionLayoutProps {
  title: string;
  description: string;
  actionButton?: React.ReactNode;
  extraInfo?: React.ReactNode;
  children: React.ReactNode;
  titleColor?: string;
}

export const SectionLayout: React.FC<SectionLayoutProps> = ({
  title,
  description,
  actionButton,
  extraInfo,
  children,
  titleColor = "#111827",
}) => {
  return (
    <div 
      style={{ 
        display: "flex", 
        flexDirection: "row",
        gap: "32px", 
        alignItems: "flex-start",
      }}
      className="section-layout"
    >
      <style jsx>{`
        @media (max-width: 768px) {
          .section-layout {
            flex-direction: column !important;
          }
          .section-sidebar {
            flex: 1 !important;
            max-width: 100% !important;
          }
        }
      `}</style>
      <div className="section-sidebar" style={{ flex: "0 0 400px" }}>
        <h2 style={{ margin: "0 0 16px 0", fontSize: "20px", color: titleColor, fontWeight: "600" }}>
          {title}
        </h2>
        <p style={{ color: "#6b7280", margin: "0 0 16px 0", fontSize: "14px", lineHeight: "1.6" }}>
          {description}
        </p>
        {actionButton}
        {extraInfo}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
};
