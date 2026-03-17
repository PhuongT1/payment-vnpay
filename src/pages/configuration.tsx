/**
 * VNPay Configuration Management Page
 * Similar to Adyen's configuration management in Saleor Dashboard
 */

import Head from "next/head";
import { useState, useEffect } from "react";

interface VNPayConfig {
  id: string;
  name: string;
  tmnCode: string;
  environment: "sandbox" | "production";
  isActive: boolean;
  createdAt: string;
}

interface Channel {
  id: string;
  name: string;
  slug: string;
  configId?: string;
}

export default function VNPayConfigPage() {
  const [configs, setConfigs] = useState<VNPayConfig[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newConfig, setNewConfig] = useState({
    name: "",
    tmnCode: "",
    hashSecret: "",
    environment: "sandbox" as "sandbox" | "production",
  });

  // Load configurations and channels
  useEffect(() => {
    loadConfigs();
    loadChannels();
  }, []);

  const loadConfigs = async () => {
    // TODO: Implement API to load configs from database
    // For now, load from localStorage
    const saved = localStorage.getItem("vnpay_configs");
    if (saved) {
      setConfigs(JSON.parse(saved));
    }
  };

  const loadChannels = async () => {
    // TODO: Implement Saleor GraphQL query to get channels
    // Mock data for now
    setChannels([
      { id: "1", name: "Default Channel", slug: "default-channel" },
      { id: "2", name: "Channel-PLN", slug: "channel-pln" },
    ]);
  };

  const handleAddConfig = () => {
    const config: VNPayConfig = {
      id: `config_${Date.now()}`,
      name: newConfig.name,
      tmnCode: newConfig.tmnCode,
      environment: newConfig.environment,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const updated = [...configs, config];
    setConfigs(updated);
    localStorage.setItem("vnpay_configs", JSON.stringify(updated));
    
    // Also save credentials
    const credentials = JSON.parse(localStorage.getItem("vnpay_credentials") || "{}");
    credentials[config.id] = {
      tmnCode: newConfig.tmnCode,
      hashSecret: newConfig.hashSecret,
      environment: newConfig.environment,
    };
    localStorage.setItem("vnpay_credentials", JSON.stringify(credentials));

    setShowAddForm(false);
    setNewConfig({ name: "", tmnCode: "", hashSecret: "", environment: "sandbox" });
  };

  const handleDeleteConfig = (id: string) => {
    const updated = configs.filter((c) => c.id !== id);
    setConfigs(updated);
    localStorage.setItem("vnpay_configs", JSON.stringify(updated));

    // Also remove credentials
    const credentials = JSON.parse(localStorage.getItem("vnpay_credentials") || "{}");
    delete credentials[id];
    localStorage.setItem("vnpay_credentials", JSON.stringify(credentials));
  };

  const handleAssignChannel = (channelId: string, configId: string) => {
    const updated = channels.map((ch) =>
      ch.id === channelId ? { ...ch, configId: configId || undefined } : ch
    );
    setChannels(updated);
    localStorage.setItem("vnpay_channel_mappings", JSON.stringify(updated));
  };

  return (
    <>
      <Head>
        <title>VNPay Configuration - Saleor App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", fontFamily: "system-ui" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ margin: 0, fontSize: "2rem", color: "#111827" }}>VNPay</h1>
          <p style={{ margin: "0.5rem 0 0 0", color: "#6b7280" }}>
            Saleor App Payment VNPay is a payment integration app that allows merchants using the Saleor e-commerce platform to accept online payments from customers using VNPay as their payment processor.
          </p>
        </div>

        {/* VNPay Configurations Section */}
        <div style={{ marginBottom: "3rem" }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            marginBottom: "1.5rem",
          }}>
            <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#111827" }}>VNPay Configurations</h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              style={{
                padding: "0.75rem 1.5rem",
                background: "#111827",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              Add new configuration
            </button>
          </div>

          <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
            Create VNPay configurations that can be later assigned to Saleor channels.
          </p>

          {/* Add Configuration Form */}
          {showAddForm && (
            <div style={{
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "1.5rem",
              marginBottom: "1.5rem",
            }}>
              <h3 style={{ marginTop: 0, color: "#111827" }}>New Configuration</h3>
              
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                  Configuration Name
                </label>
                <input
                  type="text"
                  value={newConfig.name}
                  onChange={(e) => setNewConfig({ ...newConfig, name: e.target.value })}
                  placeholder="e.g., Sandbox Config, Production Config"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "1rem",
                  }}
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                  TMN Code (vnp_TmnCode)
                </label>
                <input
                  type="text"
                  value={newConfig.tmnCode}
                  onChange={(e) => setNewConfig({ ...newConfig, tmnCode: e.target.value })}
                  placeholder="e.g., 9BPJ5NYM"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "1rem",
                  }}
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                  Hash Secret (vnp_HashSecret)
                </label>
                <input
                  type="password"
                  value={newConfig.hashSecret}
                  onChange={(e) => setNewConfig({ ...newConfig, hashSecret: e.target.value })}
                  placeholder="Your secret key from VNPay"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "1rem",
                  }}
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                  Environment
                </label>
                <select
                  value={newConfig.environment}
                  onChange={(e) => setNewConfig({ ...newConfig, environment: e.target.value as any })}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "1rem",
                  }}
                >
                  <option value="sandbox">Sandbox (test-payment.vnpay.vn)</option>
                  <option value="production">Production (payment.vnpay.vn)</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  onClick={handleAddConfig}
                  disabled={!newConfig.name || !newConfig.tmnCode || !newConfig.hashSecret}
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: newConfig.name && newConfig.tmnCode && newConfig.hashSecret ? "#10b981" : "#9ca3af",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: newConfig.name && newConfig.tmnCode && newConfig.hashSecret ? "pointer" : "not-allowed",
                    fontWeight: "500",
                  }}
                >
                  Save Configuration
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  style={{padding: "0.75rem 1.5rem",
                    background: "#f3f4f6",
                    color: "#374151",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Configurations List */}
          {configs.length === 0 ? (
            <div style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              padding: "2rem",
              textAlign: "center",
            }}>
              <p style={{ margin: 0, color: "#991b1b" }}>
                No VNPay configurations added.<br />
                This means payments are not processed by VNPay.
              </p>
            </div>
          ) : (
            <div style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              overflow: "hidden",
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "#f9fafb" }}>
                  <tr>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e5e7eb" }}>
                      Name
                    </th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e5e7eb" }}>
                      TMN Code
                    </th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e5e7eb" }}>
                      Environment
                    </th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e5e7eb" }}>
                      Status
                    </th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "right", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e5e7eb" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {configs.map((config) => (
                    <tr key={config.id}>
                      <td style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb", color: "#111827", fontWeight: "500" }}>
                        {config.name}
                      </td>
                      <td style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb", color: "#6b7280", fontFamily: "monospace" }}>
                        {config.tmnCode}
                      </td>
                      <td style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb" }}>
                        <span style={{
                          padding: "0.25rem 0.75rem",
                          background: config.environment === "sandbox" ? "#fef3c7" : "#dbeafe",
                          color: config.environment === "sandbox" ? "#92400e" : "#1e40af",
                          borderRadius: "9999px",
                          fontSize: "0.875rem",
                          fontWeight: "500",
                        }}>
                          {config.environment}
                        </span>
                      </td>
                      <td style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb" }}>
                        <span style={{
                          padding: "0.25rem 0.75rem",
                          background: config.isActive ? "#d1fae5" : "#fee2e2",
                          color: config.isActive ? "#065f46" : "#991b1b",
                          borderRadius: "9999px",
                          fontSize: "0.875rem",
                          fontWeight: "500",
                        }}>
                          {config.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb", textAlign: "right" }}>
                        <button
                          onClick={() => handleDeleteConfig(config.id)}
                          style={{
                            padding: "0.5rem 1rem",
                            background: "#fef2f2",
                            color: "#dc2626",
                            border: "1px solid #fecaca",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.875rem",
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Saleor Channel Mappings Section */}
        <div>
          <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.5rem", color: "#111827" }}>Saleor channel mappings</h2>
          <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
            Assign VNPay configurations to Saleor channels.
          </p>

          {channels.length === 0 || configs.length === 0 ? (
            <div style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              padding: "2rem",
              textAlign: "center",
            }}>
              <p style={{ margin: 0, color: "#991b1b" }}>
                {configs.length === 0 
                  ? "No channels have configurations assigned. This means payments are not processed by VNPay."
                  : "Create a configuration first to assign to channels."}
              </p>
            </div>
          ) : (
            <div style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              overflow: "hidden",
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "#f9fafb" }}>
                  <tr>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e5e7eb", width: "40%" }}>
                      Saleor Channel
                    </th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e5e7eb", width: "40%" }}>
                      Configuration
                    </th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e5e7eb", width: "20%" }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {channels.map((channel) => (
                    <tr key={channel.id}>
                      <td style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb", color: "#111827", fontWeight: "500" }}>
                        {channel.name}
                      </td>
                      <td style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb" }}>
                        <select
                          value={channel.configId || ""}
                          onChange={(e) => handleAssignChannel(channel.id, e.target.value)}
                          style={{
                            width: "100%",
                            padding: "0.5rem",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "0.875rem",
                          }}
                        >
                          <option value="">Configuration name (disabled)</option>
                          {configs.map((config) => (
                            <option key={config.id} value={config.id}>
                              {config.name} - {config.environment}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb", textAlign: "center" }}>
                        {channel.configId ? (
                          <span style={{
                            padding: "0.25rem 0.75rem",
                            background: "#d1fae5",
                            color: "#065f46",
                            borderRadius: "9999px",
                            fontSize: "0.875rem",
                            fontWeight: "500",
                          }}>
                            Enabled
                          </span>
                        ) : (
                          <span style={{
                            padding: "0.25rem 0.75rem",
                            background: "#f3f4f6",
                            color: "#6b7280",
                            borderRadius: "9999px",
                            fontSize: "0.875rem",
                            fontWeight: "500",
                          }}>
                            Disabled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
