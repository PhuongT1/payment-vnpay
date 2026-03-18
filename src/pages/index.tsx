/**
 * VNPay Configuration Management Page
 * Main entry point for VNPay app configuration
 * 
 * @architecture Clean Architecture - Presentation Layer
 * Uses shared MainLayout for consistent UI across all pages
 */

import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import Head from "next/head";
import { useCallback, useEffect, useState } from "react";

import { Channel } from "../components/vnpay/ChannelMappingsTable";
import { ConfigurationPage } from "../components/vnpay/ConfigurationPage";
import { VNPayConfig } from "../components/vnpay/ConfigurationTable";
import { ManageExtensionPage } from "../components/vnpay/ManageExtensionPage";
import { VNPayDebugPage } from "../components/vnpay/VNPayDebugPage";
import { VNPayTestPage } from "../components/vnpay/VNPayTestPage";
import { MainLayout, PageView } from "../layouts";

const IndexPage = () => {
  const { appBridgeState } = useAppBridge();
  const [configs, setConfigs] = useState<VNPayConfig[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<PageView>("main");
  const [newConfig, setNewConfig] = useState({
    name: "",
    tmnCode: "",
    hashSecret: "",
    environment: "sandbox" as "sandbox" | "production",
  });

  const standaloneMode =
    typeof window !== "undefined" &&
    window.location.hostname === "localhost" &&
    !appBridgeState?.ready;

  const isLocalHost =
    typeof window !== "undefined" && window.location.href.includes("localhost");

  const loadConfigs = useCallback(async () => {
    try {
      const saleorApiUrl = appBridgeState?.saleorApiUrl;
      
      // Check standalone mode
      const isStandalone =
        typeof window !== "undefined" &&
        window.location.hostname === "localhost" &&
        !appBridgeState?.ready;

      if (isStandalone && !saleorApiUrl) {
        // Standalone mode - create default config from env
        const defaultConfig: VNPayConfig = {
          id: `config_env_default`,
          name: "Default Config (from .env)",
          tmnCode: process.env.NEXT_PUBLIC_VNPAY_TMN_CODE || "9BPJ5NYM",
          environment:
            (process.env.NEXT_PUBLIC_VNPAY_ENVIRONMENT || "sandbox") as
              | "sandbox"
              | "production",
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        setConfigs([defaultConfig]);
        return;
      }

      if (!saleorApiUrl) {
        console.warn("No Saleor API URL available");
        return;
      }

      // Fetch configs from Saleor Metadata API
      const response = await fetch("/api/configs", {
        headers: {
          "saleor-api-url": saleorApiUrl,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch configs");
      }

      const data = await response.json();
      setConfigs(data.configs || []);
    } catch (error) {
      console.error("Error loading configs:", error);
      setConfigs([]);
    }
  }, [appBridgeState?.saleorApiUrl, appBridgeState?.ready]);

  const loadChannels = useCallback(async () => {
    try {
      // Fetch real channels from Saleor API
      const saleorApiUrl = appBridgeState?.saleorApiUrl;
      if (!saleorApiUrl) {
        console.warn("No Saleor API URL available, using mock channels");
        setChannels([
          { id: "1", name: "Default Channel", slug: "default-channel" },
          { id: "2", name: "Channel-PLN", slug: "channel-pln" },
        ]);
        return;
      }

      const response = await fetch("/api/channels", {
        headers: {
          "saleor-api-url": saleorApiUrl,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch channels");
      }

      const data = await response.json();
      
      if (data.channels && Array.isArray(data.channels)) {
        const formattedChannels = data.channels.map((ch: any) => ({
          id: ch.id,
          name: ch.name,
          slug: ch.slug,
        }));
        setChannels(formattedChannels);
      } else {
        // Fallback to mock if API returns invalid data
        setChannels([
          { id: "1", name: "Default Channel", slug: "default-channel" },
        ]);
      }
    } catch (error) {
      console.error("Error loading channels:", error);
      // Fallback to mock channels on error
      setChannels([
        { id: "1", name: "Default Channel", slug: "default-channel" },
      ]);
    }
  }, [appBridgeState?.saleorApiUrl]);

  const loadMappings = useCallback(async () => {
    try {
      const saleorApiUrl = appBridgeState?.saleorApiUrl;
      if (!saleorApiUrl) {
        console.warn("No Saleor API URL available for mappings");
        return;
      }

      const response = await fetch("/api/mappings", {
        headers: {
          "saleor-api-url": saleorApiUrl,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch mappings");
      }

      const data = await response.json();
      const mappings = data.mappings || [];

      // Merge mappings into channels
      setChannels((currentChannels) =>
        currentChannels.map((ch) => {
          const mapping = mappings.find((m: any) => m.channelId === ch.id);
          return {
            ...ch,
            configId: mapping?.configId || undefined,
          };
        })
      );
    } catch (error) {
      console.error("Error loading mappings:", error);
    }
  }, [appBridgeState?.saleorApiUrl]);

  // Only run once on mount to prevent infinite re-renders
  useEffect(() => {
    loadConfigs();
    loadChannels();
    loadMappings();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddConfig = async () => {
    try {
      const saleorApiUrl = appBridgeState?.saleorApiUrl;
      if (!saleorApiUrl) {
        console.error("No Saleor API URL available");
        return;
      }

      const config: VNPayConfig = {
        id: editingId || `config_${Date.now()}`,
        name: newConfig.name,
        tmnCode: newConfig.tmnCode,
        environment: newConfig.environment,
        isActive: true,
        createdAt: editingId 
          ? configs.find(c => c.id === editingId)?.createdAt || new Date().toISOString()
          : new Date().toISOString(),
      };

      // Save to Saleor Metadata API
      const response = await fetch("/api/configs", {
        method: "POST",
        headers: {
          "saleor-api-url": saleorApiUrl,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...config,
          hashSecret: newConfig.hashSecret, // Include hashSecret for saving
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save config");
      }

      // Reload configs from server
      await loadConfigs();

      setShowAddForm(false);
      setEditingId(null);
      setNewConfig({ name: "", tmnCode: "", hashSecret: "", environment: "sandbox" });
    } catch (error) {
      console.error("Error saving config:", error);
      alert("Failed to save configuration. Please try again.");
    }
  };

  const handleEditConfig = async (config: VNPayConfig) => {
    try {
      const saleorApiUrl = appBridgeState?.saleorApiUrl;
      if (!saleorApiUrl) {
        console.error("No Saleor API URL available");
        return;
      }

      // Fetch full config with hashSecret
      const response = await fetch(`/api/configs?id=${config.id}`, {
        headers: {
          "saleor-api-url": saleorApiUrl,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch config details");
      }

      const data = await response.json();
      const fullConfig = data.config || config;

      setEditingId(config.id);
      setNewConfig({
        name: config.name,
        tmnCode: config.tmnCode,
        hashSecret: fullConfig.hashSecret || "",
        environment: config.environment,
      });
      setShowAddForm(true);
    } catch (error) {
      console.error("Error loading config for edit:", error);
      // Fallback - edit without hashSecret
      setEditingId(config.id);
      setNewConfig({
        name: config.name,
        tmnCode: config.tmnCode,
        hashSecret: "",
        environment: config.environment,
      });
      setShowAddForm(true);
    }
  };

  const handleCancelEdit = () => {
    setShowAddForm(false);
    setEditingId(null);
    setNewConfig({ name: "", tmnCode: "", hashSecret: "", environment: "sandbox" });
  };

  const handleDeleteConfig = async (id: string) => {
    try {
      const saleorApiUrl = appBridgeState?.saleorApiUrl;
      if (!saleorApiUrl) {
        console.error("No Saleor API URL available");
        return;
      }

      const response = await fetch(`/api/configs?id=${id}`, {
        method: "DELETE",
        headers: {
          "saleor-api-url": saleorApiUrl,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete config");
      }

      // Reload configs from server
      await loadConfigs();
    } catch (error) {
      console.error("Error deleting config:", error);
      alert("Failed to delete configuration. Please try again.");
    }
  };

  const handleAssignChannel = async (channelId: string, configId: string) => {
    try {
      const saleorApiUrl = appBridgeState?.saleorApiUrl;
      if (!saleorApiUrl) {
        console.error("No Saleor API URL available");
        return;
      }

      // Auto-save channel mapping to Saleor Metadata API
      const response = await fetch("/api/mappings", {
        method: "POST",
        headers: {
          "saleor-api-url": saleorApiUrl,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channelId,
          configId: configId || null, // null to remove mapping
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save channel mapping");
      }

      // Update local state immediately for better UX
      const updated = channels.map((ch) =>
        ch.id === channelId ? { ...ch, configId: configId || undefined } : ch
      );
      setChannels(updated);
    } catch (error) {
      console.error("Error saving channel mapping:", error);
      alert("Failed to save channel mapping. Please try again.");
    }
  };

  return (
    <>
      <Head>
        <title>VNPay Configuration - Saleor App</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="icon" href="/vnpay-logo.svg" />
      </Head>

      <MainLayout
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isLocalHost={isLocalHost}
      >
        {currentPage === "manage" && <ManageExtensionPage onNavigate={setCurrentPage} />}
        
        {currentPage === "test" && <VNPayTestPage onNavigate={setCurrentPage} />}
        
        {currentPage === "debug" && <VNPayDebugPage onNavigate={setCurrentPage} />}
        
        {currentPage === "main" && (
          <ConfigurationPage
            configs={configs}
            channels={channels}
            showAddForm={showAddForm}
            editingId={editingId}
            formData={newConfig}
            onFormChange={setNewConfig}
            onShowAddForm={() => setShowAddForm(true)}
            onSaveConfig={handleAddConfig}
            onCancelEdit={handleCancelEdit}
            onEditConfig={handleEditConfig}
            onDeleteConfig={handleDeleteConfig}
            onAssignChannel={handleAssignChannel}
          />
        )}
      </MainLayout>
    </>
  );
};

export default IndexPage;
