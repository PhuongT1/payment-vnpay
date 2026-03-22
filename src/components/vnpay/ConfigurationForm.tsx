/**
 * Configuration Form Component
 * Form for creating/editing VNPay configurations
 */

import React from "react";

interface ConfigFormData {
  name: string;
  tmnCode: string;
  hashSecret: string;
  returnUrl: string;
  ipnUrl: string;
  vnpVersion: string;
  vnpCommand: "pay";
  vnpBankCode: "" | "VNPAYQR" | "VNBANK" | "INTCARD";
  vnpLocale: "vn" | "en";
  environment: "sandbox" | "production";
}

interface ConfigurationFormProps {
  formData: ConfigFormData;
  isEditing: boolean;
  onFormChange: (data: ConfigFormData) => void;
  onSave: () => void;
  onCancel: () => void;
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  fontSize: "14px",
  boxSizing: "border-box" as const,
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontWeight: "500",
  fontSize: "14px",
  color: "#374151",
};

export const ConfigurationForm: React.FC<ConfigurationFormProps> = ({
  formData,
  isEditing,
  onFormChange,
  onSave,
  onCancel,
}) => {
  const isValid = formData.name && formData.tmnCode && formData.hashSecret && formData.returnUrl && formData.ipnUrl;

  const buttonSaveStyle = {
    padding: "8px 16px",
    background: isValid ? "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)" : "#9e9e9e",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: isValid ? "pointer" : "not-allowed",
    fontWeight: "600",
    fontSize: "14px",
    boxShadow: isValid ? "0 2px 8px rgba(0, 102, 204, 0.3)" : "none",
  };

  const buttonCancelStyle = {
    padding: "8px 16px",
    background: "#fff",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  };

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "24px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      }}
    >
      <h3 style={{ margin: "0 0 16px 0", color: "#111827", fontSize: "16px", fontWeight: "600" }}>
        {isEditing ? "Edit Configuration" : "New Configuration"}
      </h3>

      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>Configuration Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
          placeholder="e.g., Sandbox Config, Production Config"
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>TMN Code (vnp_TmnCode)</label>
        <input
          type="text"
          value={formData.tmnCode}
          onChange={(e) => onFormChange({ ...formData, tmnCode: e.target.value })}
          placeholder="e.g., 9BPJ5NYM"
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>Hash Secret (vnp_HashSecret)</label>
        <input
          type="password"
          value={formData.hashSecret}
          onChange={(e) => onFormChange({ ...formData, hashSecret: e.target.value })}
          placeholder="Your secret key from VNPay"
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>
          Return URL (vnp_ReturnUrl) <span style={{ color: "#dc2626" }}>*</span>
        </label>
        <input
          type="url"
          value={formData.returnUrl}
          onChange={(e) => onFormChange({ ...formData, returnUrl: e.target.value })}
          placeholder="https://yourdomain.com/vnpay-return"
          style={inputStyle}
        />
        <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#6b7280" }}>
          URL VNPay redirect sau khi thanh toán (vnp_ReturnUrl)
        </p>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>
          IPN URL (Webhook) <span style={{ color: "#dc2626" }}>*</span>
        </label>
        <input
          type="url"
          value={formData.ipnUrl}
          onChange={(e) => onFormChange({ ...formData, ipnUrl: e.target.value })}
          placeholder="https://yourdomain.com/api/vnpay/ipn"
          style={inputStyle}
        />
        <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#6b7280" }}>
          URL server-to-server callback để xác nhận giao dịch
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <div>
          <label style={labelStyle}>Phiên bản API (vnp_Version)</label>
          <input
            type="text"
            value={formData.vnpVersion}
            onChange={(e) => onFormChange({ ...formData, vnpVersion: e.target.value })}
            placeholder="2.1.0"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Lệnh giao dịch (vnp_Command)</label>
          <input
            type="text"
            value="pay"
            readOnly
            style={{ ...inputStyle, background: "#f3f4f6", color: "#9ca3af", cursor: "not-allowed" }}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <div>
          <label style={labelStyle}>Phương thức thanh toán (vnp_BankCode)</label>
          <select
            value={formData.vnpBankCode}
            onChange={(e) =>
              onFormChange({
                ...formData,
                vnpBankCode: e.target.value as ConfigFormData["vnpBankCode"],
              })
            }
            style={{ ...inputStyle, background: "#fff" }}
          >
            <option value="">Khách tự chọn tại VNPay</option>
            <option value="VNPAYQR">VNPAYQR - QR Code</option>
            <option value="VNBANK">VNBANK - Thẻ ATM nội địa</option>
            <option value="INTCARD">INTCARD - Thẻ quốc tế</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Ngôn ngữ (vnp_Locale)</label>
          <select
            value={formData.vnpLocale}
            onChange={(e) =>
              onFormChange({ ...formData, vnpLocale: e.target.value as "vn" | "en" })
            }
            style={{ ...inputStyle, background: "#fff" }}
          >
            <option value="vn">Tiếng Việt (vn)</option>
            <option value="en">English (en)</option>
          </select>
        </div>
      </div>
      <div style={{ marginBottom: "24px" }}>
        <label style={labelStyle}>Environment</label>
        <select
          value={formData.environment}
          onChange={(e) =>
            onFormChange({ ...formData, environment: e.target.value as "sandbox" | "production" })
          }
          style={{ ...inputStyle, background: "#fff" }}
        >
          <option value="sandbox">Sandbox (sandbox.vnpayment.vn)</option>
          <option value="production">Production (payment.vnpay.vn)</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
        <button type="button" onClick={onSave} disabled={!isValid} style={buttonSaveStyle}>
          {isEditing ? "Update Configuration" : "Save Configuration"}
        </button>
        <button type="button" onClick={onCancel} style={buttonCancelStyle}>
          Cancel
        </button>
      </div>
    </div>
  );
};

