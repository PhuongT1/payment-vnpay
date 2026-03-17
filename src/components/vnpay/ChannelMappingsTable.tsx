/**
 * Channel Mappings Table Component
 * Displays Saleor channels with VNPay configuration assignments
 */

import React from "react";

import { VNPayConfig } from "./ConfigurationTable";

export interface Channel {
  id: string;
  name: string;
  slug: string;
  configId?: string;
}

interface ChannelMappingsTableProps {
  channels: Channel[];
  configs: VNPayConfig[];
  onAssignChannel: (channelId: string, configId: string) => void;
}

export const ChannelMappingsTable: React.FC<ChannelMappingsTableProps> = ({
  channels,
  configs,
  onAssignChannel,
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
                width: "40%",
              }}
            >
              Saleor Channel
            </th>
            <th
              style={{
                padding: "12px 16px",
                textAlign: "left",
                fontWeight: "500",
                color: "#6b7280",
                borderBottom: "1px solid #e5e7eb",
                width: "40%",
              }}
            >
              Configuration
            </th>
            <th
              style={{
                padding: "12px 16px",
                textAlign: "left",
                fontWeight: "500",
                color: "#6b7280",
                borderBottom: "1px solid #e5e7eb",
                width: "20%",
              }}
            >
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {channels.map((channel) => (
            <tr key={channel.id}>
              <td
                style={{
                  padding: "16px",
                  borderBottom: "1px solid #e5e7eb",
                  color: "#111827",
                  fontWeight: "600",
                }}
              >
                {channel.name}
              </td>
              <td style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}>
                <select
                  value={channel.configId || ""}
                  onChange={(e) => onAssignChannel(channel.id, e.target.value)}
                  style={{
                    width: "100%",
                    maxWidth: "400px",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    background: "#fff",
                    color: channel.configId ? "#111827" : "#9ca3af",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="" disabled>
                    Configuration name (disabled)
                  </option>
                  {configs.map((config) => (
                    <option key={config.id} value={config.id}>
                      {config.name}
                    </option>
                  ))}
                </select>
              </td>
              <td style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}>
                {channel.configId ? (
                  <span
                    style={{
                      padding: "4px 10px",
                      background: "#a7f3d0",
                      color: "#065f46",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "500",
                    }}
                  >
                    Enabled
                  </span>
                ) : (
                  <span
                    style={{
                      padding: "3px 9px",
                      background: "transparent",
                      color: "#6b7280",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "500",
                    }}
                  >
                    Disabled
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
