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
    const saved = localStorage.getItem("vnpay_configs");
    let loadedConfigs: VNPayConfig[] = saved ? JSON.parse(saved) : [];

    // Check standalone mode inside the function to avoid dependency issues
    const isStandalone =
      typeof window !== "undefined" &&
      window.location.hostname === "localhost" &&
      !appBridgeState?.ready;

    if (isStandalone && loadedConfigs.length === 0) {
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

      loadedConfigs = [defaultConfig];
      localStorage.setItem("vnpay_configs", JSON.stringify(loadedConfigs));

      const credentials = {
        [defaultConfig.id]: {
          tmnCode: process.env.NEXT_PUBLIC_VNPAY_TMN_CODE || "9BPJ5NYM",
          hashSecret:
            process.env.NEXT_PUBLIC_VNPAY_HASH_SECRET || "8H7WMLT2J77PW2WJW78DI67ETKG5R6QG",
          environment: process.env.NEXT_PUBLIC_VNPAY_ENVIRONMENT || "sandbox",
        },
      };
      localStorage.setItem("vnpay_credentials", JSON.stringify(credentials));
    }

    setConfigs(loadedConfigs);
  }, []); // Empty dependency array - only recreate if needed
  // eslint-disable-next-line react-hooks/exhaustive-deps

  const loadChannels = useCallback(async () => {
    setChannels([
      { id: "1", name: "Default Channel", slug: "default-channel" },
      { id: "2", name: "Channel-PLN", slug: "channel-pln" },
    ]);
  }, []);

  // Only run once on mount to prevent infinite re-renders
  useEffect(() => {
    loadConfigs();
    loadChannels();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      updated = configs.map((c) => (c.id === editingId ? config : c));
    } else {
      updated = [...configs, config];
    }

    setConfigs(updated);
    localStorage.setItem("vnpay_configs", JSON.stringify(updated));

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
