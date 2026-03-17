/**
 * VNPay Test Page Component
 * ==========================
 * Test payment initialization and transaction queries
 * 
 * @architecture Clean Architecture - Presentation Layer
 * @patterns Smart Component (contains business logic)
 */

import React, { useState } from "react";

import { PageContainer } from "../../layouts";
import { Breadcrumbs } from "./Breadcrumbs";
import { PageHeading } from "./PageHeading";

type PageView = "main" | "manage" | "test" | "debug";

interface VNPayTestPageProps {
  onNavigate?: (page: PageView) => void;
}

export const VNPayTestPage: React.FC<VNPayTestPageProps> = ({ onNavigate }) => {
  const [testData, setTestData] = useState({
    orderId: `TEST_${Date.now()}`,
    amount: 100000,
    orderInfo: "Test payment for VNPay integration",
    bankCode: "",
  });

  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInitialize = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/test/vnpay-initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testData),
      });

      const data = await response.json();
      data.success ? setResult(data) : setError(data.message || "Failed to initialize payment");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    primary: { padding: "10px 20px", background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px", boxShadow: "0 2px 8px rgba(25, 118, 210, 0.3)" },
    success: { padding: "10px 20px", background: "#2e7d32", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px", boxShadow: "0 2px 8px rgba(46, 125, 50, 0.3)", transition: "all 0.2s" },
    input: { width: "100%", padding: "10px 14px", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" as const, transition: "border-color 0.2s" },
    label: { display: "block", marginBottom: "6px", fontWeight: "500", fontSize: "14px", color: "#424242" },
  };

  return (
    <PageContainer>
      <Breadcrumbs currentPage="Test Payment" onNavigate={onNavigate} />
      <PageHeading title="VNPay Payment Test" />

      <style jsx>{`
        @media (max-width: 768px) {
          .test-form {
            padding: 20px 16px !important;
          }
        }
        input:focus {
          outline: none;
          border-color: #1976d2;
          box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
        }
      `}</style>

      {/* Test Form */}
      <div
        className="test-form"
        style={{
          background: "#fff",
          border: "1px solid #e0e0e0",
          borderRadius: "12px",
          padding: "28px",
          marginBottom: "24px",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.08)",
          maxWidth: "800px",
        }}
      >
        <h2 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: "600", color: "#212121" }}>
          Test Configuration
        </h2>

        <div style={{ display: "grid", gap: "16px" }}>
          <div>
            <label style={styles.label}>Order ID</label>
            <input type="text" value={testData.orderId} onChange={(e) => setTestData({ ...testData, orderId: e.target.value })} style={styles.input} />
          </div>

          <div>
            <label style={styles.label}>Amount (VND)</label>
            <input type="number" value={testData.amount} onChange={(e) => setTestData({ ...testData, amount: parseInt(e.target.value) })} style={styles.input} />
          </div>

          <div>
            <label style={styles.label}>Order Info</label>
            <input type="text" value={testData.orderInfo} onChange={(e) => setTestData({ ...testData, orderInfo: e.target.value })} style={styles.input} />
          </div>

          <button type="button" onClick={handleInitialize} disabled={loading} style={{ ...styles.primary, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}>
            {loading ? "Processing..." : "Initialize Payment"}
          </button>
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div
          style={{
            background: "#e3f2fd",
            border: "1px solid #90caf9",
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "24px",
            maxWidth: "800px",
          }}
        >
          <h3 style={{ margin: "0 0 16px 0", color: "#1565c0", fontSize: "18px", fontWeight: "600" }}>
            Success!
          </h3>
          
          {(result.data?.paymentUrl || result.data?.paymentURL) && (
            <div style={{ marginBottom: "16px" }}>
              <button
                type="button"
                onClick={() => window.open(result.data.paymentUrl || result.data.paymentURL, "_blank")}
                style={styles.success}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(46, 125, 50, 0.4)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(46, 125, 50, 0.3)"; }}
              >
                🚀 Open VNPay Payment Page
              </button>
            </div>
          )}
          
          <pre style={{ overflow: "auto", fontSize: "13px", color: "#424242", lineHeight: "1.6" }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {error && (
        <div
          style={{
            background: "#ffebee",
            border: "1px solid #ef9a9a",
            borderRadius: "12px",
            padding: "24px",
            color: "#c62828",
            fontSize: "14px",
            maxWidth: "800px",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}
    </PageContainer>
  );
};