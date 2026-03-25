/**
 * VNPay App Header Component
 * Main header with logo, navigation menu with icons, and action buttons
 */

import Image from "next/image";
import React from "react";

interface AppHeaderProps {
  currentPage: "main" | "manage" | "test" | "debug";
  onNavigate: (page: "main" | "manage" | "test" | "debug") => void;
  isLocalHost: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentPage,
  onNavigate,
  isLocalHost,
}) => {
  const showBackButton = currentPage !== "main";

  return (
    <div
      style={{
        borderBottom: "1px solid #e5e7eb",
        background: "linear-gradient(to right, #ffffff 0%, #f8fafc 100%)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
      }}
    >
      <style jsx>{`
        @media (max-width: 768px) {
          .header-actions {
            gap: 8px !important;
            flex-wrap: wrap;
          }
          .header-actions button {
            font-size: 12px !important;
            padding: 6px 10px !important;
          }
          .header-logo img {
            max-width: 160px !important;
            height: 32px !important;
          }
          .nav-menu {
            gap: 8px !important;
          }
        }
      `}</style>
      <div
        style={{
          padding: "18px max(24px, calc((100vw - 1600px) / 2))",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: "1600px",
          margin: "0 auto",
        }}
      >
        {/* Left: Logo & Navigation Menu */}
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div className="header-logo" style={{ minWidth: "180px", display: "flex", alignItems: "center" }}>
            <Image 
              src="/vnpay-logo.svg" 
              alt="VNPay" 
              width={200} 
              height={40} 
              priority 
              style={{ objectFit: "contain", width: "auto", height: "40px", maxWidth: "200px" }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const fallback = document.createElement("div");
                fallback.innerHTML = '<span style="font-size: 24px; font-weight: 700; background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">VNPay</span>';
                e.currentTarget.parentElement?.appendChild(fallback);
              }}
            />
          </div>

          {/* Navigation Menu with Icons */}
          <div className="nav-menu" style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            {/* Home */}
            <button
              type="button"
              onClick={() => onNavigate("main")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 14px",
                background: currentPage === "main" ? "#e3f2fd" : "transparent",
                border: "none",
                borderRadius: "8px",
                color: currentPage === "main" ? "#1976d2" : "#6b7280",
                fontWeight: currentPage === "main" ? "600" : "500",
                fontSize: "14px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (currentPage !== "main") {
                  e.currentTarget.style.background = "#f3f4f6";
                  e.currentTarget.style.color = "#374151";
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== "main") {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#6b7280";
                }
              }}
            >
              {/* Home Icon (Grid) */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
              <span>Home</span>
            </button>

            {/* Dev Tools Menu */}
            {isLocalHost && (
              <>
                {/* Test Page */}
                <button
                  type="button"
                  onClick={() => onNavigate("test")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 14px",
                    background: currentPage === "test" ? "#fef3c7" : "transparent",
                    border: "none",
                    borderRadius: "8px",
                    color: currentPage === "test" ? "#d97706" : "#6b7280",
                    fontWeight: currentPage === "test" ? "600" : "500",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage !== "test") {
                      e.currentTarget.style.background = "#f3f4f6";
                      e.currentTarget.style.color = "#374151";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentPage !== "test") {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#6b7280";
                    }
                  }}
                >
                  {/* Payment Icon */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                  <span>Test Payment</span>
                </button>

                {/* Debug Console */}
                <button
                  type="button"
                  onClick={() => onNavigate("debug")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 14px",
                    background: currentPage === "debug" ? "#fef3c7" : "transparent",
                    border: "none",
                    borderRadius: "8px",
                    color: currentPage === "debug" ? "#d97706" : "#6b7280",
                    fontWeight: currentPage === "debug" ? "600" : "500",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage !== "debug") {
                      e.currentTarget.style.background = "#f3f4f6";
                      e.currentTarget.style.color = "#374151";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentPage !== "debug") {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#6b7280";
                    }
                  }}
                >
                  {/* Debug Icon (Terminal) */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M7 10l3 3-3 3M13 16h5" />
                  </svg>
                  <span>Debug Console</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="header-actions" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            type="button"
            style={{
              padding: "8px 16px",
              background: "#fff",
              color: "#424242",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "500",
              fontSize: "14px",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
            }}
          >
            Support
          </button>
          <button
            type="button"
            style={{
              padding: "8px 18px",
              background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              boxShadow: "0 2px 8px rgba(25, 118, 210, 0.3)",
            }}
          >
            Homepage
          </button>
        </div>
      </div>
    </div>
  );
};
