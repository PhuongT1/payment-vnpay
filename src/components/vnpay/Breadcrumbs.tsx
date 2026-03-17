/**
 * Breadcrumbs Component
 * Navigation breadcrumbs for all VNPay pages
 */

import React from "react";

type PageView = "main" | "manage" | "test" | "debug";

interface BreadcrumbsProps {
  currentPage: string;
  onNavigate?: (page: PageView) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ currentPage, onNavigate }) => {
  return (
    <div
      style={{
        marginBottom: "20px",
        fontSize: "14px",
        color: "#757575",
        display: "flex",
        alignItems: "center",
      }}
    >
      <span
        onClick={() => onNavigate?.("main")}
        style={{
          cursor: "pointer",
          color: "#1976d2",
          fontWeight: "500",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#1565c0")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#1976d2")}
      >
        Home
      </span>
      <span style={{ margin: "0 8px" }}>/</span>
      <span style={{ color: "#212121", fontWeight: "500" }}>{currentPage}</span>
    </div>
  );
};
