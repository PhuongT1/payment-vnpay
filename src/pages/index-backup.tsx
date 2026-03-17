/**
 * VNPay Configuration Management Page
 * Main page displayed in Saleor Dashboard and localhost
 */

import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import Head from "next/head";
import { useCallback, useEffect, useState } from "react";

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

const IndexPage = () => {
  const { appBridgeState } = useAppBridge();
  const [configs, setConfigs] = useState<VNPayConfig[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showManagePage, setShowManagePage] = useState(false);
  const [newConfig, setNewConfig] = useState({
    name: "",
    tmnCode: "",
    hashSecret: "",
    environment: "sandbox" as "sandbox" | "production",
  });

  // Detect standalone mode (localhost without Saleor Dashboard)
  const standaloneMode = typeof window !== "undefined" && 
    window.location.hostname === "localhost" && 
    !appBridgeState?.ready;

  const loadConfigs = useCallback(async () => {
    // Check if we have configs in localStorage
    const saved = localStorage.getItem("vnpay_configs");
    let loadedConfigs: VNPayConfig[] = saved ? JSON.parse(saved) : [];

    // In dev mode (localhost), auto-create default config from .env if no configs exist
    if (standaloneMode && loadedConfigs.length === 0) {
      const defaultConfig: VNPayConfig = {
        id: `config_env_default`,
        name: "Default Config (from .env)",
        tmnCode: process.env.NEXT_PUBLIC_VNPAY_TMN_CODE || "9BPJ5NYM",
        environment: (process.env.NEXT_PUBLIC_VNPAY_ENVIRONMENT || "sandbox") as "sandbox" | "production",
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      loadedConfigs = [defaultConfig];
      localStorage.setItem("vnpay_configs", JSON.stringify(loadedConfigs));

      // Also save credentials
      const credentials = {
        [defaultConfig.id]: {
          tmnCode: process.env.NEXT_PUBLIC_VNPAY_TMN_CODE || "9BPJ5NYM",
          hashSecret: process.env.NEXT_PUBLIC_VNPAY_HASH_SECRET || "8H7WMLT2J77PW2WJW78DI67ETKG5R6QG",
          environment: process.env.NEXT_PUBLIC_VNPAY_ENVIRONMENT || "sandbox",
        },
      };
      localStorage.setItem("vnpay_credentials", JSON.stringify(credentials));
    }

    setConfigs(loadedConfigs);
  }, [standaloneMode]);

  const loadChannels = useCallback(async () => {
    // Mock channels for standalone mode
    setChannels([
      { id: "1", name: "Default Channel", slug: "default-channel" },
      { id: "2", name: "Channel-PLN", slug: "channel-pln" },
    ]);
  }, []);

  // Load configurations and channels
  useEffect(() => {
    loadConfigs();
    loadChannels();
  }, [loadConfigs, loadChannels]);

  const handleAddConfig = () => {
    const config: VNPayConfig = {
      id: editingId || `config_${Date.now()}`,
      name: newConfig.name,
      tmnCode: newConfig.tmnCode,
      environment: newConfig.environment,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    let updated: VNPayConfig[];
    
    if (editingId) {
      // Update existing config
      updated = configs.map((c) => (c.id === editingId ? config : c));
    } else {
      // Add new config
      updated = [...configs, config];
    }

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
    setEditingId(null);
    setNewConfig({ name: "", tmnCode: "", hashSecret: "", environment: "sandbox" });
  };

  const handleEditConfig = (config: VNPayConfig) => {
    // Load credentials for this config
    const credentials = JSON.parse(localStorage.getItem("vnpay_credentials") || "{}");
    const configCreds = credentials[config.id] || {};

    setEditingId(config.id);
    setNewConfig({
      name: config.name,
      tmnCode: config.tmnCode,
      hashSecret: configCreds.hashSecret || "",
      environment: config.environment,
    });
    setShowAddForm(true);
  };

  const handleCancelEdit = () => {
    setShowAddForm(false);
    setEditingId(null);
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

  const isLocalHost = typeof window !== "undefined" && window.location.href.includes("localhost");

  return (
    <>
      <Head>
        <title>VNPay Configuration - Saleor App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Top Header Bar */}
      <div style={{
        borderBottom: "1px solid #e5e7eb",
        background: "#fff",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{
          padding: "16px 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: "1400px",
          margin: "0 auto",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {showManagePage && (
              <button
                onClick={() => setShowManagePage(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  color: "#6b7280",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            <div style={{
              width: "36px",
              height: "36px",
              background: "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              color: "#fff",
              fontSize: "16px",
            }}>
              VN
            </div>
            <h1 style={{ margin: 0, fontSize: "18px", color: "#111827", fontWeight: "600" }}>VNPay</h1>
          </div>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            {!showManagePage && (
              <button
                onClick={() => setShowManagePage(true)}
                style={{
                  padding: "8px 16px",
                  background: "#fff",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "500",
                  fontSize: "14px",
                }}
              >
                Manage extension
              </button>
            )}
            <button
              style={{
                padding: "8px 16px",
                background: "#fff",
                color: "#374151",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "14px",
              }}
            >
              Support
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
                fontSize: "14px",
              }}
            >
              Homepage
            </button>
          </div>
        </div>
      </div>

      {showManagePage ? (
        /* Manage Extension Page */
        <div style={{ padding: "48px 64px", maxWidth: "1400px", margin: "0 auto", fontFamily: "system-ui, -apple-system, blinkmacsystemfont, 'Segoe UI', roboto, helvetica, arial, sans-serif" }}>
          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "16px", marginBottom: "48px", paddingBottom: "24px", borderBottom: "1px solid #e5e7eb" }}>
            <button
              style={{
                padding: "8px 16px",
                background: "#fff",
                color: "#374151",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "14px",
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
                fontSize: "14px",
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
          <div style={{ display: "flex", gap: "48px" }}>
            {/* Left Column */}
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "#111827", fontWeight: "600" }}>About this extension</h2>
              <p style={{ margin: "0 0 32px 0", color: "#6b7280", fontSize: "14px", lineHeight: "1.6" }}>
                Saleor App Payment VNPay is a payment integration app that allows merchants using the Saleor e-commerce platform to accept online payments from customers using VNPay as their payment processor.
              </p>

              <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "#111827", fontWeight: "600" }}>Extension permissions</h3>
              <p style={{ margin: "0 0 16px 0", color: "#6b7280", fontSize: "14px" }}>This extension has permissions to:</p>
              <ul style={{ margin: "0 0 16px 0", paddingLeft: "24px", color: "#6b7280", fontSize: "14px" }}>
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
                  fontSize: "14px",
                }}
              >
                Edit permissions
              </button>
            </div>

            {/* Right Column */}
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "#111827", fontWeight: "600" }}>Extension Webhooks</h2>
              <p style={{ margin: "0 0 24px 0", color: "#6b7280", fontSize: "14px", lineHeight: "1.6" }}>
                All webhooks registered by this extension. In case of failed webhook delivery, list of attempts is displayed.
              </p>

              {/* Webhook List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {[
                  { name: "PaymentGatewayInitializeSession", desc: "Initialize payment gateway session" },
                  { name: "TransactionInitializeSession", desc: "Initialize transaction session" },
                  { name: "TransactionProcessSession", desc: "Process transaction session" },
                  { name: "TransactionCancelationRequested", desc: "Transaction cancelation requested" },
                  { name: "TransactionChargeRequested", desc: "Transaction charge requested" },
                  { name: "TransactionRefundRequested", desc: "Transaction refund requested" },
                ].map((webhook, idx) => (
                  <div key={idx}>
                    <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", color: "#111827", fontWeight: "500" }}>{webhook.name}</h4>
                    <p style={{ margin: 0, color: "#6b7280", fontSize: "13px" }}>{webhook.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Main Configuration Page */
      <div style={{ padding: "48px 64px", maxWidth: "1400px", margin: "0 auto", fontFamily: "system-ui, -apple-system, blinkmacsystemfont, 'Segoe UI', roboto, helvetica, arial, sans-serif" }}>

        {/* Quick Links for Development */}
        {isLocalHost && (
          <div style={{
            background: "#f0f9ff",
            border: "1px solid #bae6fd",
            borderRadius: "8px",
            padding: "20px 24px",
            marginBottom: "48px",
          }}>
            <h3 style={{ margin: "0 0 12px 0", color: "#0c4a6e", fontSize: "16px", fontWeight: "600" }}>Development Tools</h3>
            <div style={{ display: "flex", gap: "24px" }}>
              <a href="/vnpay-test" target="_blank" style={{ color: "#0284c7", textDecoration: "underline", fontWeight: "500", fontSize: "14px" }}>
                VNPay Test Page
              </a>
              <a href="/vnpay-debug" target="_blank" style={{ color: "#0284c7", textDecoration: "underline", fontWeight: "500", fontSize: "14px" }}>
                VNPay Debug Console
              </a>
            </div>
          </div>
        )}

        {/* VNPay Configurations Section */}
        <div style={{ marginBottom: "48px" }}>
          <div style={{ display: "flex", gap: "32px", alignItems: "flex-start" }}>
            <div style={{ flex: "0 0 400px" }}>
              <h2 style={{ margin: "0 0 16px 0", fontSize: "20px", color: "#111827", fontWeight: "600" }}>VNPay Configurations</h2>
              <p style={{ color: "#6b7280", margin: "0 0 16px 0", fontSize: "14px", lineHeight: "1.6" }}>
                Create VNPay configurations that can be later assigned to Saleor channels.
              </p>
              {!showAddForm && configs.length > 0 && (
                <button
                  onClick={() => setShowAddForm(true)}
                  style={{
                    padding: "8px 16px",
                    background: "#1f2937",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "14px",
                    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                  }}
                >
                  Open Logs
                </button>
              )}
            </div>
            <div style={{ flex: 1 }}>

          {/* Add Configuration Form */}
          {showAddForm && (
            <div style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "24px",
              marginBottom: "24px",
            }}>
              <h3 style={{ margin: "0 0 16px 0", color: "#111827", fontSize: "16px", fontWeight: "600" }}>
                {editingId ? "Edit Configuration" : "New Configuration"}
              </h3>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "14px", color: "#374151" }}>
                  Configuration Name
                </label>
                <input
                  type="text"
                  value={newConfig.name}
                  onChange={(e) => setNewConfig({ ...newConfig, name: e.target.value })}
                  placeholder="e.g., Sandbox Config, Production Config"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box"
                  }} />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "14px", color: "#374151" }}>
                  TMN Code (vnp_TmnCode)
                </label>
                <input
                  type="text"
                  value={newConfig.tmnCode}
                  onChange={(e) => setNewConfig({ ...newConfig, tmnCode: e.target.value })}
                  placeholder="e.g., 9BPJ5NYM"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box"
                  }} />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "14px", color: "#374151" }}>
                  Hash Secret (vnp_HashSecret)
                </label>
                <input
                  type="password"
                  value={newConfig.hashSecret}
                  onChange={(e) => setNewConfig({ ...newConfig, hashSecret: e.target.value })}
                  placeholder="Your secret key from VNPay"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box"
                  }} />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "14px", color: "#374151" }}>
                  Environment
                </label>
                <select
                  value={newConfig.environment}
                  onChange={(e) => setNewConfig({ ...newConfig, environment: e.target.value as any })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    background: "#fff",
                    boxSizing: "border-box"
                  }}
                >
                  <option value="sandbox">Sandbox (sandbox.vnpayment.vn)</option>
                  <option value="production">Production (payment.vnpay.vn)</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                <button
                  onClick={handleAddConfig}
                  disabled={!newConfig.name || !newConfig.tmnCode || !newConfig.hashSecret}
                  style={{
                    padding: "8px 16px",
                    background: newConfig.name && newConfig.tmnCode && newConfig.hashSecret ? "#111827" : "#9ca3af",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: newConfig.name && newConfig.tmnCode && newConfig.hashSecret ? "pointer" : "not-allowed",
                    fontWeight: "600",
                    fontSize: "14px"
                  }}
                >
                  {!!editingId ? "Update Configuration" : "Save Configuration"}
                </button>
                <button
                  onClick={handleCancelEdit}
                  style={{
                    padding: "8px 16px",
                    background: "#fff",
                    color: "#374151",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "14px",
                    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

              {/* Configurations List */}
              {!showAddForm && configs.length === 0 ? (
                <div style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "80px 32px",
                  textAlign: "center",
                }}>
                  <p style={{ margin: "0 0 4px 0", color: "#b91c1c", fontWeight: "400", fontSize: "14px" }}>
                    No VNPay configurations added.
                  </p>
                  <p style={{ margin: "0 0 32px 0", color: "#b91c1c", fontSize: "14px", fontWeight: "400" }}>
                    This means payments are not processed by VNPay.
                  </p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    style={{
                      padding: "10px 20px",
                      background: "#1f2937",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "14px",
                      boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                    }}
                  >
                    Add new configuration
                  </button>
                </div>
              ) : !showAddForm && (
            <div style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              overflow: "hidden",
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead style={{ background: "#fff" }}>
                  <tr>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: "500", color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>
                      Name
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: "500", color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>
                      TMN Code
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: "500", color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>
                      Environment
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: "500", color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>
                      Status
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: "500", color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {configs.map((config) => (
                    <tr key={config.id}>
                      <td style={{ padding: "16px", borderBottom: "1px solid #e5e7eb", color: "#111827", fontWeight: "600" }}>
                        {config.name}
                      </td>
                      <td style={{ padding: "16px", borderBottom: "1px solid #e5e7eb", color: "#6b7280" }}>
                        {config.tmnCode}
                      </td>
                      <td style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}>
                        <span style={{
                          padding: "4px 10px",
                          background: config.environment === "sandbox" ? "#fef08a" : "#dbeafe",
                          color: config.environment === "sandbox" ? "#92400e" : "#1e40af",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "500",
                        }}>
                          {config.environment}
                        </span>
                      </td>
                      <td style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}>
                        <span style={{
                          padding: "4px 10px",
                          background: config.isActive ? "#a7f3d0" : "#fee2e2",
                          color: config.isActive ? "#065f46" : "#991b1b",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "500",
                        }}>
                          {config.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                          <button
                            onClick={() => handleEditConfig(config)}
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
                            onClick={() => handleDeleteConfig(config.id)}
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
          )}
            </div>
          </div>
        </div>

        {/* Saleor Channel Mappings Section */}
        <div>
          <div style={{ display: "flex", gap: "32px", alignItems: "flex-start" }}>
            <div style={{ flex: "0 0 400px" }}>
              <h2 style={{ margin: "0 0 16px 0", fontSize: "20px", color: configs.length === 0 ? "#d1d5db" : "#111827", fontWeight: "600" }}>Saleor channel mappings</h2>
              <p style={{ color: "#6b7280", margin: "0 0 16px 0", fontSize: "14px", lineHeight: "1.6" }}>
                Assign VNPay configurations to Saleor channels.
              </p>
              {configs.length === 0 && (
                <div>
                  <p style={{ margin: "0 0 4px 0", color: "#b91c1c", fontWeight: "400", fontSize: "14px" }}>
                    No channels have configurations assigned.
                  </p>
                  <p style={{ margin: 0, color: "#b91c1c", fontSize: "14px", fontWeight: "400" }}>
                    This means payments are not processed by VNPay.
                  </p>
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
          {configs.length > 0 && (
            <div style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              overflow: "hidden",
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead style={{ background: "#fff" }}>
                  <tr>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: "500", color: "#6b7280", borderBottom: "1px solid #e5e7eb", width: "40%" }}>
                      Saleor Channel
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: "500", color: "#6b7280", borderBottom: "1px solid #e5e7eb", width: "40%" }}>
                      Configuration
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: "500", color: "#6b7280", borderBottom: "1px solid #e5e7eb", width: "20%" }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {channels.map((channel) => (
                    <tr key={channel.id}>
                      <td style={{ padding: "16px", borderBottom: "1px solid #e5e7eb", color: "#111827", fontWeight: "600" }}>
                        {channel.name}
                      </td>
                      <td style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}>
                        <select
                          value={channel.configId || ""}
                          onChange={(e) => handleAssignChannel(channel.id, e.target.value)}
                          style={{
                            width: "100%",
                            maxWidth: "400px",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "14px",
                            background: "#fff",
                            color: channel.configId ? "#111827" : "#9ca3af",
                            boxSizing: "border-box"
                          }}
                        >
                          <option value="" disabled>Configuration name (disabled)</option>
                          {configs.map((config) => (
                            <option key={config.id} value={config.id}>
                              {config.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}>
                        {channel.configId ? (
                          <span style={{
                            padding: "4px 10px",
                            background: "#a7f3d0",
                            color: "#065f46",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "500",
                          }}>
                            Enabled
                          </span>
                        ) : (
                          <span style={{
                            padding: "3px 9px",
                            background: "transparent",
                            color: "#6b7280",
                            border: "1px solid #d1d5db",
                            borderRadius: "4px",
                            fontSize: "12px",
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
        </div>
      </div>
      )}
    </>
  );
};

export default IndexPage;

