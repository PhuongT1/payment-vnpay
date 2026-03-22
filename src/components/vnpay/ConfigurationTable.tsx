/**
 * Configuration Table Component
 * Displays list of VNPay configurations with edit/delete actions
 */

import React from "react";

export interface VNPayConfig {
  id: string;
  name: string;
  tmnCode: string;
  returnUrl?: string;
  ipnUrl?: string;
  vnpVersion?: string;
  vnpBankCode?: string;
  vnpLocale?: string;
  environment: "sandbox" | "production";
  isActive: boolean;
  createdAt: string;
}

interface ConfigurationTableProps {
  configs: VNPayConfig[];
  onEdit: (config: VNPayConfig) => void;
  onDelete: (id: string) => void;
}

export const ConfigurationTable: React.FC<ConfigurationTableProps> = ({
  configs,
  onEdit,
  onDelete,
}) => {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
        <thead style={{ background: "#fff" }}>
          <tr>
            <th
              style={{
                padding: "12px 16px",
                textAlign: "left",
                fontWeight: "500",
                color: "#6b7280",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              Name
            </th>
            <th
              style={{
                padding: "12px 16px",
                textAlign: "left",
                fontWeight: "500",
                color: "#6b7280",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              TMN Code
            </th>
            <th
              style={{
                padding: "12px 16px",
                textAlign: "left",
                fontWeight: "500",
                color: "#6b7280",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              Environment
            </th>
            <th
              style={{
                padding: "12px 16px",
                textAlign: "left",
                fontWeight: "500",
                color: "#6b7280",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              Status
            </th>
            <th
              style={{
                padding: "12px 16px",
                textAlign: "right",
                fontWeight: "500",
                color: "#6b7280",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {configs.map((config) => (
            <tr key={config.id}>
              <td
                style={{
                  padding: "16px",
                  borderBottom: "1px solid #e5e7eb",
                  color: "#111827",
                  fontWeight: "600",
                }}
              >
                {config.name}
              </td>
              <td
                style={{
                  padding: "16px",
                  borderBottom: "1px solid #e5e7eb",
                  color: "#6b7280",
                }}
              >
                {config.tmnCode}
              </td>
              <td style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}>
                <span
                  style={{
                    padding: "4px 10px",
                    background: config.environment === "sandbox" ? "#fef08a" : "#dbeafe",
                    color: config.environment === "sandbox" ? "#92400e" : "#1e40af",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: "500",
                  }}
                >
                  {config.environment}
                </span>
              </td>
              <td style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}>
                <span
                  style={{
                    padding: "4px 10px",
                    background: config.isActive ? "#a7f3d0" : "#fee2e2",
                    color: config.isActive ? "#065f46" : "#991b1b",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: "500",
                  }}
                >
                  {config.isActive ? "Active" : "Inactive"}
                </span>
              </td>
              <td style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}>
                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => onEdit(config)}
                    style={{
                      padding: "6px 12px",
                      background: "transparent",
                      color: "#2563eb",
                      border: "1px solid #bfdbfe",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "500",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(config.id)}
                    style={{
                      padding: "6px 12px",
                      background: "#fee2e2",
                      color: "#ef4444",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "500",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
