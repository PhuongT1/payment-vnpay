/**
 * VNPay Logo Component
 * Official VNPay logo in SVG format
 */

import React from "react";

interface VNPayLogoProps {
  size?: number;
  className?: string;
}

export const VNPayLogo: React.FC<VNPayLogoProps> = ({ size = 36, className }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background Circle with Gradient */}
      <defs>
        <linearGradient id="vnpayGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1976d2" />
          <stop offset="50%" stopColor="#1565c0" />
          <stop offset="100%" stopColor="#0d47a1" />
        </linearGradient>
      </defs>
      
      {/* Main Circle */}
      <circle cx="50" cy="50" r="48" fill="url(#vnpayGradient)" />
      
      {/* White VNP Text */}
      <text
        x="50"
        y="58"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="28"
        fontWeight="700"
        fill="white"
        textAnchor="middle"
      >
        VNP
      </text>
      
      {/* Bottom accent line */}
      <rect x="20" y="70" width="60" height="3" rx="1.5" fill="white" fillOpacity="0.8" />
    </svg>
  );
};

export const VNPayLogoHorizontal: React.FC<{ height?: number }> = ({ height = 40 }) => {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <VNPayLogo size={height} />
      <span
        style={{
          fontSize: `${height * 0.5}px`,
          fontWeight: "700",
          background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: "-0.02em",
        }}
      >
        VNPay
      </span>
    </div>
  );
};
