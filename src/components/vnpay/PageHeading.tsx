/**
 * Page Heading Component
 * Reusable heading with gradient style for VNPay pages
 */

import React from "react";

interface PageHeadingProps {
  title: string;
}

export const PageHeading: React.FC<PageHeadingProps> = ({ title }) => {
  return (
    <h1
      style={{
        margin: "0 0 24px 0",
        fontSize: "28px",
        fontWeight: "700",
        background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}
    >
      {title}
    </h1>
  );
};
