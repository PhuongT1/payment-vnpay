/**
 * VNPay Debug Console Component
 * ==============================
 * Advanced testing and debugging interface with real-time logs
 * 
 * @architecture Clean Architecture - Presentation Layer
 * @patterns Smart Component (contains state and business logic)
 */

import React, { useState } from "react";

import { PageContainer } from "../../layouts";
import { Breadcrumbs } from "./Breadcrumbs";
import { PageHeading } from "./PageHeading";

interface LogEntry {
  timestamp: string;
  level: "info" | "success" | "error" | "warning";
  message: string;
  data?: any;
}

type PageView = "main" | "manage" | "test" | "debug";

interface VNPayDebugPageProps {
  onNavigate?: (page: PageView) => void;
}

const getLevelColor = (level: string) => {
  const colors = {
    success: "#2e7d32",
    error: "#d32f2f",
    warning: "#f57c00",
    info: "#0288d1",
  };
  return colors[level as keyof typeof colors] || "#6b7280";
};

export const VNPayDebugPage: React.FC<VNPayDebugPageProps> = ({ onNavigate }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<any>(null);

  const addLog = (level: LogEntry["level"], message: string, data?: any) => {
    setLogs((prev) => [
      { timestamp: new Date().toLocaleTimeString("vi-VN"), level, message, data },
      ...prev,
    ].slice(0, 100));
  };

  const clearLogs = () => {
    setLogs([]);
    addLog("info", "Logs cleared");
  };

  const testConnection = async () => {
    addLog("info", "Testing VNPay connection...");
    try {
      const response = await fetch("/api/test/vnpay-initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: `DEBUG_${Date.now()}`,
          amount: 10000,
          orderInfo: "Debug test",
        }),
      });
      const data = await response.json();
      if (data.success) {
        addLog("success", "Connection successful", data);
        setResult(data);
      } else {
        addLog("error", "Connection failed", data);
      }
    } catch (err) {
      addLog("error", err instanceof Error ? err.message : "Unknown error");
    }
  };

  return (
    <PageContainer>
      <Breadcrumbs currentPage="Debug Console" onNavigate={onNavigate} />
      <PageHeading title="VNPay Debug Console" />

      {/* Control Panel */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          display: "flex",
          gap: "12px",
        }}
      >
        <button
          onClick={testConnection}
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
          Test Connection
        </button>
        <button
          onClick={clearLogs}
          style={{
            padding: "10px 20px",
            background: "#f3f4f6",
            color: "#374151",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px",
          }}
        >
          Clear Logs
        </button>
      </div>

      {/* Logs Display */}
      <div
        style={{
          background: "#1e293b",
          borderRadius: "12px",
          padding: "24px",
          minHeight: "400px",
          maxHeight: "600px",
          overflowY: "auto",
          fontFamily: "monospace",
          fontSize: "13px",
        }}
      >
        {logs.length === 0 ? (
          <div style={{ color: "#94a3b8", textAlign: "center", paddingTop: "40px" }}>
            No logs yet. Click &ldquo;Test Connection&rdquo; to start.
          </div>
        ) : (
          logs.map((log, idx) => (
            <div
              key={idx}
              style={{
                padding: "8px 12px",
                marginBottom: "8px",
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: "6px",
                borderLeft: `4px solid ${getLevelColor(log.level)}`,
              }}
            >
              <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "4px" }}>
                <span style={{ color: "#94a3b8", fontSize: "11px" }}>{log.timestamp}</span>
                <span
                  style={{
                    color: getLevelColor(log.level),
                    fontWeight: "600",
                    textTransform: "uppercase",
                    fontSize: "11px",
                  }}
                >
                  {log.level}
                </span>
              </div>
              <div style={{ color: "#e2e8f0" }}>{log.message}</div>
              {log.data && (
                <pre
                  style={{
                    marginTop: "8px",
                    padding: "12px",
                    background: "rgba(0, 0, 0, 0.3)",
                    borderRadius: "4px",
                    color: "#cbd5e1",
                    fontSize: "12px",
                    overflow: "auto",
                  }}
                >
                  {JSON.stringify(log.data, null, 2)}
                </pre>
              )}
            </div>
          ))
        )}
      </div>
    </PageContainer>
  );
};
