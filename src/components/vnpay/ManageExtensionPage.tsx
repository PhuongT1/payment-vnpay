/**
 * Manage Extension Page Component
 * ================================
 * Displays extension information, permissions, and webhooks
 * 
 * @architecture Clean Architecture - Presentation Layer
 * @patterns Presentational Component (UI only)
 */

import React from "react";

import { PageContainer } from "../../layouts";
import { Breadcrumbs } from "./Breadcrumbs";
import { PageHeading } from "./PageHeading";

type PageView = "main" | "manage" | "test" | "debug";

interface ManageExtensionPageProps {
  onNavigate?: (page: PageView) => void;
}

export const ManageExtensionPage: React.FC<ManageExtensionPageProps> = ({ onNavigate }) => {
  const webhooks = [
    { name: "PaymentGatewayInitializeSession", desc: "Initialize payment gateway session" },
    { name: "TransactionInitializeSession", desc: "Initialize transaction session" },
    { name: "TransactionProcessSession", desc: "Process transaction session" },
    { name: "TransactionCancelationRequested", desc: "Transaction cancelation requested" },
    { name: "TransactionChargeRequested", desc: "Transaction charge requested" },
    { name: "TransactionRefundRequested", desc: "Transaction refund requested" },
  ];

  return (
    <PageContainer>
      <Breadcrumbs currentPage="Manage Extension" onNavigate={onNavigate} />
      <PageHeading title="Manage Extension" />

      {/* Action Buttons */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "48px",
          paddingBottom: "24px",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <button
          style={{
            padding: "8px 16px",
            background: "#fff",
            color: "#374151",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "500",
            fontSize: "15px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
          </svg>
          Deactivate
        </button>
        <button
          style={{
            padding: "8px 16px",
            background: "#fff",
            color: "#374151",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "500",
            fontSize: "15px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Delete
        </button>
      </div>

      {/* Two Column Layout */}
      <div 
        style={{ display: "flex", flexDirection: "row", gap: "48px" }}
        className="two-column-layout"
      >
        <style jsx>{`
          @media (max-width: 768px) {
            .two-column-layout {
              flex-direction: column !important;
            }
          }
        `}</style>
        {/* Left Column */}
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: "0 0 16px 0", fontSize: "22px", color: "#111827", fontWeight: "600" }}>
            About this extension
          </h2>
          <p
            style={{
              margin: "0 0 32px 0",
              color: "#6b7280",
              fontSize: "16px",
              lineHeight: "1.6",
            }}
          >
            Saleor App Payment VNPay is a payment integration app that allows merchants using
            the Saleor e-commerce platform to accept online payments from customers using VNPay
            as their payment processor.
          </p>

          <h3 style={{ margin: "0 0 16px 0", fontSize: "22px", color: "#111827", fontWeight: "600" }}>
            Extension permissions
          </h3>
          <p style={{ margin: "0 0 16px 0", color: "#6b7280", fontSize: "16px" }}>
            This extension has permissions to:
          </p>
          <ul
            style={{
              margin: "0 0 16px 0",
              paddingLeft: "24px",
              color: "#6b7280",
              fontSize: "16px",
            }}
          >
            <li style={{ marginBottom: "8px" }}>Handle payments</li>
          </ul>
          <button
            style={{
              padding: "8px 16px",
              background: "#fff",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "500",
              fontSize: "16px",
            }}
          >
            Edit permissions
          </button>
        </div>

        {/* Right Column */}
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: "0 0 16px 0", fontSize: "22px", color: "#111827", fontWeight: "600" }}>
            Extension Webhooks
          </h2>
          <p
            style={{
              margin: "0 0 24px 0",
              color: "#6b7280",
              fontSize: "16px",
              lineHeight: "1.6",
            }}
          >
            All webhooks registered by this extension. In case of failed webhook delivery,
            list of attempts is displayed.
          </p>

          {/* Webhook List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {webhooks.map((webhook, idx) => (
              <div key={idx}>
                <h4
                  style={{
                    margin: "0 0 4px 0",
                    fontSize: "16px",
                    color: "#111827",
                    fontWeight: "500",
                  }}
                >
                  {webhook.name}
                </h4>
                <p style={{ margin: 0, color: "#6b7280", fontSize: "15px" }}>{webhook.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
