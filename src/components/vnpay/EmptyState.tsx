/**
 * Empty State Component
 * Displays empty state message with action button
 */

import React from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  buttonText: string;
  onButtonClick: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  buttonText,
  onButtonClick,
}) => {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "80px 32px",
        textAlign: "center",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      }}
    >
      <p style={{ margin: "0 0 4px 0", color: "#b91c1c", fontWeight: "400", fontSize: "14px" }}>
        {title}
      </p>
      <p style={{ margin: "0 0 32px 0", color: "#b91c1c", fontSize: "14px", fontWeight: "400" }}>
        {description}
      </p>
      <button
        type="button"
        onClick={onButtonClick}
        style={{
          padding: "10px 20px",
          background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "600",
          fontSize: "14px",
          boxShadow: "0 2px 8px rgba(0, 102, 204, 0.3)",
        }}
      >
        {buttonText}
      </button>
    </div>
  );
};
