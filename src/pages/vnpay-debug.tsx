/**
 * VNPay Debug Console - Advanced testing and debugging interface
 */

import Head from "next/head";
import { useEffect, useState } from "react";

interface LogEntry {
  timestamp: string;
  level: "info" | "success" | "error" | "warning";
  message: string;
  data?: any;
}

export default function VNPayDebugPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  
  const [testData, setTestData] = useState({
    orderId: `TEST_${Date.now()}`,
    amount: 100000,
    orderInfo: "Test payment for VNPay integration",
    bankCode: "",
  });

  const [result, setResult] = useState<any>(null);
  const [showPaymentUrl, setShowPaymentUrl] = useState(false);

  // Add log entry
  const addLog = (level: LogEntry["level"], message: string, data?: any) => {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString("vi-VN"),
      level,
      message,
      data,
    };
    setLogs((prev) => [entry, ...prev].slice(0, 100)); // Keep last 100 logs
  };

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
    addLog("info", "Logs cleared");
  };

  // Test initialization
  const handleInitialize = async () => {
    addLog("info", `Initializing payment for Order: ${testData.orderId}`);
    setStatus("loading");
    setResult(null);

    try {
      const response = await fetch("/api/test/vnpay-initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testData),
      });

      const data = await response.json();
      
      addLog("info", "Received response from initialize API", {
        status: response.status,
        success: data.success,
      });

      if (data.success) {
        setResult(data);
        setStatus("success");
        setShowPaymentUrl(true);
        addLog("success", "Payment initialized successfully!", {
          paymentUrl: data.data.paymentUrl,
          transactionRef: data.data.transactionRef,
        });
      } else {
        setStatus("error");
        addLog("error", `Initialization failed: ${data.message}`, data);
      }
    } catch (err) {
      setStatus("error");
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      addLog("error", `Error during initialization: ${errorMsg}`, err);
    }
  };

  // Test query
  const handleQuery = async () => {
    addLog("info", `Querying transaction status for Order: ${testData.orderId}`);
    setStatus("loading");

    try {
      const response = await fetch(
        `/api/test/vnpay-query?orderId=${testData.orderId}`
      );
      const data = await response.json();

      addLog("info", "Received query response", {
        status: response.status,
        success: data.success,
      });

      if (data.success) {
        setResult(data);
        setStatus("success");
        
        const queryData = data.data;
        const isSuccess = queryData.vnp_ResponseCode === "00" && queryData.vnp_TransactionStatus === "00";
        
        addLog(
          isSuccess ? "success" : "warning",
          `Query result: ${queryData.vnp_Message} (Code: ${queryData.vnp_ResponseCode})`,
          queryData
        );
      } else {
        setStatus("error");
        addLog("error", `Query failed: ${data.message}`, data);
      }
    } catch (err) {
      setStatus("error");
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      addLog("error", `Error during query: ${errorMsg}`, err);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addLog("info", "Copied to clipboard");
  };

  // Get status color
  const getStatusColor = () => {
    switch (status) {
      case "success": return "#10b981";
      case "error": return "#ef4444";
      case "loading": return "#f59e0b";
      default: return "#6b7280";
    }
  };

  return (
    <>
      <Head>
        <title>VNPay Debug Console</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div style={{ 
        minHeight: "100vh", 
        background: "#0f172a",
        color: "#e2e8f0",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: "14px",
        overflowX: "hidden",
        width: "100%",
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: "1.5rem 2rem",
          borderBottom: "2px solid #4c1d95",
        }}>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "bold" }}>
            🔬 VNPay Debug Console
          </h1>
          <p style={{ margin: "0.5rem 0 0 0", opacity: 0.9, fontSize: "0.875rem" }}>
            Advanced testing & debugging interface
          </p>
        </div>

        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "minmax(0, 1fr) minmax(350px, 400px)", 
          gap: "1rem",
          padding: "1.5rem",
          maxWidth: "1600px",
          margin: "0 auto",
          width: "100%",
          overflow: "hidden",
        }}
        className="debug-grid"
        >
          {/* Left Panel - Test Controls */}
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: "1rem",
            minWidth: 0,
            overflow: "hidden",
          }}>
            {/* Status Indicator */}
            <div style={{
              background: "#1e293b",
              border: `2px solid ${getStatusColor()}`,
              borderRadius: "8px",
              padding: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              minWidth: 0,
              overflow: "hidden",
            }}>
              <div style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: getStatusColor(),
                boxShadow: `0 0 10px ${getStatusColor()}`,
                animation: status === "loading" ? "pulse 1.5s infinite" : "none",
              }} />
              <div>
                <div style={{ fontWeight: "bold", textTransform: "uppercase" }}>
                  {status === "idle" && "Ready to test"}
                  {status === "loading" && "Processing..."}
                  {status === "success" && "Success"}
                  {status === "error" && "Error occurred"}
                </div>
                <div style={{ 
                  fontSize: "0.75rem", 
                  opacity: 0.7, 
                  marginTop: "0.25rem",
                  wordBreak: "break-all",
                  overflowWrap: "break-word",
                }}>
                  Order ID: {testData.orderId}
                </div>
              </div>
            </div>

            {/* Test Form */}
            <div style={{
              background: "#1e293b",
              borderRadius: "8px",
              padding: "1.5rem",
              border: "1px solid #334155",
              minWidth: 0,
              overflow: "hidden",
            }}>
              <h3 style={{ marginTop: 0, marginBottom: "1rem", color: "#f1f5f9" }}>
                Test Configuration
              </h3>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", color: "#cbd5e1" }}>
                  Order ID:
                </label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    value={testData.orderId}
                    onChange={(e) => setTestData({ ...testData, orderId: e.target.value })}
                    style={{
                      flex: 1,
                      padding: "0.5rem",
                      background: "#0f172a",
                      border: "1px solid #475569",
                      borderRadius: "4px",
                      color: "#e2e8f0",
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newId = `TEST_${Date.now()}`;
                      setTestData({ ...testData, orderId: newId });
                      addLog("info", `Generated new Order ID: ${newId}`);
                    }}
                    style={{
                      padding: "0.5rem 1rem",
                      background: "#475569",
                      border: "none",
                      borderRadius: "4px",
                      color: "#e2e8f0",
                      cursor: "pointer",
                    }}
                  >
                    New ID
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", color: "#cbd5e1" }}>
                  Amount (VND):
                </label>
                <input
                  type="number"
                  value={testData.amount}
                  onChange={(e) => setTestData({ ...testData, amount: Number(e.target.value) })}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    background: "#0f172a",
                    border: "1px solid #475569",
                    borderRadius: "4px",
                    color: "#e2e8f0",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", color: "#cbd5e1" }}>
                  Bank Code:
                </label>
                <select
                  value={testData.bankCode}
                  onChange={(e) => setTestData({ ...testData, bankCode: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    background: "#0f172a",
                    border: "1px solid #475569",
                    borderRadius: "4px",
                    color: "#e2e8f0",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">User selects at VNPay</option>
                  <option value="NCB">NCB Bank</option>
                  <option value="VNPAYQR">VNPAY QR</option>
                  <option value="VNBANK">ATM Card / Bank</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={handleInitialize}
                  disabled={status === "loading"}
                  style={{
                    padding: "0.75rem",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    border: "none",
                    borderRadius: "4px",
                    color: "#fff",
                    fontWeight: "bold",
                    cursor: status === "loading" ? "not-allowed" : "pointer",
                    opacity: status === "loading" ? 0.6 : 1,
                  }}
                >
                  ▶ Initialize
                </button>
                <button
                  onClick={handleQuery}
                  disabled={status === "loading"}
                  style={{
                    padding: "0.75rem",
                    background: "#10b981",
                    border: "none",
                    borderRadius: "4px",
                    color: "#fff",
                    fontWeight: "bold",
                    cursor: status === "loading" ? "not-allowed" : "pointer",
                    opacity: status === "loading" ? 0.6 : 1,
                  }}
                >
                  🔍 Query
                </button>
              </div>
            </div>

            {/* Payment URL */}
            {showPaymentUrl && result?.data?.paymentUrl && (
              <div style={{
                background: "#1e293b",
                borderRadius: "8px",
                padding: "1.5rem",
                border: "2px solid #10b981",
                minWidth: 0,
                overflow: "hidden",
              }}>
                <h3 style={{ marginTop: 0, marginBottom: "1rem", color: "#10b981" }}>
                  ✅ Payment URL Ready
                </h3>
                <div style={{
                  background: "#0f172a",
                  padding: "0.75rem",
                  borderRadius: "4px",
                  marginBottom: "1rem",
                  fontSize: "0.75rem",
                  wordBreak: "break-all",
                  color: "#94a3b8",
                  overflowWrap: "break-word",
                  maxWidth: "100%",
                }}>
                  {result.data.paymentUrl}
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => window.open(result.data.paymentUrl, "_blank")}
                    style={{
                      flex: 1,
                      padding: "0.75rem",
                      background: "#10b981",
                      border: "none",
                      borderRadius: "4px",
                      color: "#fff",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    🚀 Open Payment Page
                  </button>
                  <button
                    onClick={() => copyToClipboard(result.data.paymentUrl)}
                    style={{
                      padding: "0.75rem 1rem",
                      background: "#475569",
                      border: "none",
                      borderRadius: "4px",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
            )}

            {/* Result Panel */}
            {result && (
              <div style={{
                background: "#1e293b",
                borderRadius: "8px",
                padding: "1.5rem",
                border: "1px solid #334155",
                minWidth: 0,
                overflow: "hidden",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3 style={{ margin: 0, color: "#f1f5f9" }}>Response Data</h3>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
                    style={{
                      padding: "0.25rem 0.75rem",
                      background: "#475569",
                      border: "none",
                      borderRadius: "4px",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                    }}
                  >
                    Copy JSON
                  </button>
                </div>
                <pre style={{
                  background: "#0f172a",
                  padding: "1rem",
                  borderRadius: "4px",
                  overflow: "auto",
                  maxHeight: "400px",
                  fontSize: "0.75rem",
                  margin: 0,
                  maxWidth: "100%",
                  boxSizing: "border-box",
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                  whiteSpace: "pre-wrap",
                }}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Right Panel - Logs Console */}
          <div style={{
            background: "#1e293b",
            borderRadius: "8px",
            border: "1px solid #334155",
            display: "flex",
            flexDirection: "column",
            maxHeight: "calc(100vh - 150px)",
            position: "sticky",
            top: "1.5rem",
            minWidth: 0, // Allow flex item to shrink
          }}
          className="log-panel"
          >
            <div style={{
              padding: "1rem",
              borderBottom: "1px solid #334155",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <h3 style={{ margin: 0, fontSize: "1rem", color: "#f1f5f9" }}>
                📜 Console Logs ({logs.length})
              </h3>
              <button
                onClick={clearLogs}
                style={{
                  padding: "0.25rem 0.75rem",
                  background: "#475569",
                  border: "none",
                  borderRadius: "4px",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                }}
              >
                Clear
              </button>
            </div>
            
            <div style={{
              flex: 1,
              overflow: "auto",
              padding: "0.5rem",
            }}>
              {logs.length === 0 ? (
                <div style={{
                  textAlign: "center",
                  padding: "2rem",
                  color: "#64748b",
                  fontSize: "0.875rem",
                }}>
                  No logs yet. Start testing to see logs here.
                </div>
              ) : (
                logs.map((log, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "0.5rem",
                      marginBottom: "0.5rem",
                      background: "#0f172a",
                      borderLeft: `3px solid ${
                        log.level === "success" ? "#10b981" :
                        log.level === "error" ? "#ef4444" :
                        log.level === "warning" ? "#f59e0b" : "#3b82f6"
                      }`,
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                    }}
                  >
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.25rem" }}>
                      <span style={{ color: "#64748b" }}>{log.timestamp}</span>
                      <span style={{
                        color: 
                          log.level === "success" ? "#10b981" :
                          log.level === "error" ? "#ef4444" :
                          log.level === "warning" ? "#f59e0b" : "#3b82f6",
                        fontWeight: "bold",
                      }}>
                        [{log.level.toUpperCase()}]
                      </span>
                    </div>
                    <div style={{ 
                      color: "#cbd5e1",
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                    }}>{log.message}</div>
                    {log.data && (
                      <pre style={{
                        marginTop: "0.5rem",
                        padding: "0.5rem",
                        background: "#020617",
                        borderRadius: "4px",
                        fontSize: "0.7rem",
                        overflow: "auto",
                        color: "#94a3b8",
                        maxWidth: "100%",
                        boxSizing: "border-box",
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                        whiteSpace: "pre-wrap",
                      }}>
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @media (max-width: 1200px) {
          .debug-grid {
            grid-template-columns: 1fr !important;
            padding: 1rem !important;
          }
          
          .log-panel {
            position: relative !important;
            top: 0 !important;
            max-height: 500px !important;
          }
        }
        
        @media (max-width: 768px) {
          .debug-grid {
            padding: 0.75rem !important;
          }
        }
        
        /* Ensure inputs don't overflow */
        input, select {
          box-sizing: border-box;
          max-width: 100%;
        }
        
        /* Prevent horizontal scroll and text overflow */
        * {
          box-sizing: border-box;
        }
        
        pre, code {
          word-break: break-word;
          overflow-wrap: break-word;
          white-space: pre-wrap;
          max-width: 100%;
        }
        
        div {
          overflow-wrap: break-word;
          word-wrap: break-word;
        }
      `}</style>
    </>
  );
}
