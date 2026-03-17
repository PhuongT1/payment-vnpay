/**
 * VNPay Configuration Page
 * Following Saleor App UI patterns with Macaw UI components
 */

import { useState, useEffect } from "react";
import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Box, Button, Input, Text } from "@saleor/macaw-ui";

const SALEOR_API_URL_HEADER = "saleor-api-url";

interface ConfigEntry {
  configurationId: string;
  configurationName: string;
  partnerCode: string;
  accessKey: string;
  secretKey: string;
  redirectUrl: string;
  ipnUrl: string;
  environment: "sandbox" | "production";
  channelId?: string;
}

export default function ConfigurationPage() {
  const { appBridgeState } = useAppBridge();
  const [configs, setConfigs] = useState<ConfigEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [standaloneMode, setStandaloneMode] = useState(false);
  
  const [formData, setFormData] = useState<Partial<ConfigEntry>>({
    environment: "sandbox",
  });

  // Use localStorage for standalone mode (development only)
  const saleorApiUrl = appBridgeState?.saleorApiUrl || "standalone-mode";

  useEffect(() => {
    // Check if running in standalone mode (localhost without Saleor Dashboard)
    const isLocalhost = typeof window !== "undefined" && window.location.hostname === "localhost";
    const noAppBridge = !appBridgeState?.ready;
    
    if (isLocalhost && noAppBridge) {
      setStandaloneMode(true);
    }
    
    loadConfigs();
  }, [appBridgeState]);

  const loadConfigs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Standalone mode: use localStorage
      if (standaloneMode) {
        const saved = localStorage.getItem("vnpay_configs_standalone");
        if (saved) {
          setConfigs(JSON.parse(saved));
        }
        setLoading(false);
        return;
      }

      // Production mode: use Saleor metadata API
      const response = await fetch("/api/vnpay-configuration", {
        headers: {
          [SALEOR_API_URL_HEADER]: saleorApiUrl,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to load configurations");
      }

      setConfigs(data.configurations || []);
    } catch (err) {
      // Standalone mode: use localStorage
      if (standaloneMode) {
        const newConfig: ConfigEntry = {
          ...formData,
          configurationId: editingId || `vnpay_${Date.now()}`,
        } as ConfigEntry;

        let updatedConfigs: ConfigEntry[];
        if (editingId) {
          updatedConfigs = configs.map(c => 
            c.configurationId === editingId ? newConfig : c
          );
        } else {
          updatedConfigs = [...configs, newConfig];
        }

        setConfigs(updatedConfigs);
        localStorage.setItem("vnpay_configs_standalone", JSON.stringify(updatedConfigs));
        
        setShowForm(false);
        setEditingId(null);
        setFormData({ environment: "sandbox" });
        return;
      }

      // Production mode: use API
      setError(err instanceof Error ? err.message : "Failed to load configurations");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const method = editingId ? "PUT" : "POST";
      const body = editingId
        ? { configurationId: editingId, ...formData }
        : formData;

      const response = await fetch("/api/vnpay-configuration", {
        method,
        headers: {
          "Content-Type": "application/json",
          [SALEOR_API_URL_HEADER]: saleorApiUrl,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to save configuration");
      }

      await loadConfigs();
      setShowForm(false);
      setEditingId(null);
      setFormData({ environment: "sandbox" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save configuration");
    }
  };

  const handleEdit = (config: ConfigEntry) => {
    setFormData(config);
    setEditingId(config.configurationId);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this configuration?")) {
      return;
    }

    setError(null);

    try {
      // Standalone mode: use localStorage
      if (standaloneMode) {
        const updatedConfigs = configs.filter(c => c.configurationId !== id);
        setConfigs(updatedConfigs);
        localStorage.setItem("vnpay_configs_standalone", JSON.stringify(updatedConfigs));
        return;
      }

      // Production mode: use API
      const response = await fetch(`/api/vnpay-configuration?id=${id}`, {
        method: "DELETE",
        headers: {
          [SALEOR_API_URL_HEADER]: saleorApiUrl,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to delete configuration");
      }

      await loadConfigs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete configuration");
    }
  };

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    setError(null);

    try {
      const response = await fetch("/api/test-vnpay-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [SALEOR_API_URL_HEADER]: saleorApiUrl,
        },
        body: JSON.stringify({ configurationId: id }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Connection successful!\n\n${data.message}`);
      } else {
        alert(`❌ Connection failed\n\n${data.message || data.error}`);
      }
    } catch (err) {
      alert(`❌ Test failed\n\n${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setTestingId(null);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ environment: "sandbox" });
    setError(null);
  };

  if (loading && configs.length === 0) {
    return (
      <Box padding={8}>
        <Text>Loading configurations...</Text>
      </Box>
    );
  }

  return (
    <Box padding={8}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={4}>
        <Box>
          <Text size={1}>VNPay Payment Configuration</Text>
          <Text marginTop={1}>
            Configure VNPay payment gateway credentials and settings
          </Text>
        </Box>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            Add Configuration
          </Button>
        )}
      </Box>

      {/* Error Message */}
      {error && (
        <Box
          padding={4}
          marginBottom={4}
          backgroundColor="critical1"
          borderRadius={4}
        >
          <Text color="critical1">{error}</Text>
        </Box>
      )}

      {/* Configuration Form */}
      {showForm && (
        <Box
          as="form"
          onSubmit={handleSubmit}
          padding={6}
          marginBottom={4}
          backgroundColor="default2"
          borderRadius={4}
        >
          <Text marginBottom={4}>
            <strong>{editingId ? "Edit Configuration" : "New Configuration"}</strong>
          </Text>

          <Box display="grid" gridTemplateColumns={12} gap={4}>
            <Box gridColumn="full">
              <Input
                label="Configuration Name *"
                value={formData.configurationName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, configurationName: e.target.value })
                }
                required
              />
            </Box>

            <Input
              label="Partner Code (vnp_TmnCode) *"
              value={formData.partnerCode || ""}
              onChange={(e) =>
                setFormData({ ...formData, partnerCode: e.target.value })
              }
              required
            />

            <Input
              label="Access Key *"
              value={formData.accessKey || ""}
              onChange={(e) =>
                setFormData({ ...formData, accessKey: e.target.value })
              }
              required
            />

            <Box gridColumn="full">
              <Input
                label="Secret Key (vnp_HashSecret) *"
                type="password"
                value={formData.secretKey || ""}
                onChange={(e) =>
                  setFormData({ ...formData, secretKey: e.target.value })
                }
                required
              />
            </Box>

            <Input
              label="Redirect URL *"
              type="url"
              value={formData.redirectUrl || ""}
              onChange={(e) =>
                setFormData({ ...formData, redirectUrl: e.target.value })
              }
              placeholder="https://your-store.com/api/vnpay/return"
              required
            />

            <Input
              label="IPN URL (Webhook) *"
              type="url"
              value={formData.ipnUrl || ""}
              onChange={(e) =>
                setFormData({ ...formData, ipnUrl: e.target.value })
              }
              placeholder="https://your-store.com/api/vnpay/ipn"
              required
            />

            <Box>
              <label>
                <Text><small>Environment *</small></Text>
                <select
                  value={formData.environment}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      environment: e.target.value as "sandbox" | "production",
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                >
                  <option value="sandbox">Sandbox</option>
                  <option value="production">Production</option>
                </select>
              </label>
            </Box>
          </Box>

          <Box display="flex" gap={2} marginTop={4}>
            <Button type="submit">
              {editingId ? "Update" : "Save"} Configuration
            </Button>
            <Button type="button" variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
          </Box>
        </Box>
      )}

      {/* Configurations List */}
      {configs.length === 0 && !showForm ? (
        <Box padding={6} backgroundColor="default2" borderRadius={4}>
          <Text style={{textAlign: "center"}}>
            No configurations found. Click "Add Configuration" to create one.
          </Text>
        </Box>
      ) : (
        <Box>
          {configs.map((config) => (
            <Box
              key={config.configurationId}
              padding={4}
              marginBottom={2}
              backgroundColor="default2"
              borderRadius={4}
            >
              <Box display="flex" justifyContent="space-between" alignItems="start">
                <Box>
                  <Text><strong>{config.configurationName}</strong></Text>
                  <Box display="flex" gap={4} marginTop={2}>
                    <Text>
                      <small>Partner Code: <code>{config.partnerCode}</code></small>
                    </Text>
                    <Text>
                      Environment:{" "}
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "4px",
                          backgroundColor:
                            config.environment === "sandbox" ? "#fef3c7" : "#dbeafe",
                          color: config.environment === "sandbox" ? "#92400e" : "#1e40af",
                        }}
                      >
                        {config.environment}
                      </span>
                    </Text>
                  </Box>
                </Box>
                <Box display="flex" gap={2}>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => handleTestConnection(config.configurationId)}
                    disabled={testingId === config.configurationId}
                  >
                    {testingId === config.configurationId
                      ? "Testing..."
                      : "Test Connection"}
                  </Button>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => handleEdit(config)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="tertiary"
                    size="small"
                    onClick={() => handleDelete(config.configurationId)}
                  >
                    Delete
                  </Button>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
