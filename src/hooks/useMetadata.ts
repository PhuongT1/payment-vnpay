/**
 * React Hook: useMetadata
 * =======================
 * Custom hook to manage VNPay metadata
 * Provides CRUD operations for configurations
 */

import { useCallback, useEffect, useState } from 'react';

import { getMetadataService } from '../lib/saleor/metadata-service';
import { VNPayConfig } from '../lib/types';

interface UseMetadataResult {
  configs: VNPayConfig[];
  channelMappings: Record<string, string>;
  loading: boolean;
  error: Error | null;
  saveConfig: (config: VNPayConfig) => Promise<void>;
  deleteConfig: (id: string) => Promise<void>;
  saveChannelMapping: (channelId: string, configId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useMetadata(): UseMetadataResult {
  const [configs, setConfigs] = useState<VNPayConfig[]>([]);
  const [channelMappings, setChannelMappings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const metadataService = getMetadataService();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [configsData, mappingsData] = await Promise.all([
        metadataService.getVNPayConfigs(),
        metadataService.getChannelMappings(),
      ]);
      
      setConfigs(configsData);
      setChannelMappings(mappingsData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch metadata'));
      console.error('Error fetching metadata:', err);
    } finally {
      setLoading(false);
    }
  }, [metadataService]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveConfig = async (config: VNPayConfig) => {
    try {
      const updatedConfigs = configs.some(c => c.id === config.id)
        ? configs.map(c => c.id === config.id ? config : c)
        : [...configs, config];
      
      await metadataService.saveVNPayConfigs(updatedConfigs);
      setConfigs(updatedConfigs);
    } catch (err) {
      throw new Error('Failed to save configuration');
    }
  };

  const deleteConfig = async (id: string) => {
    try {
      const updatedConfigs = configs.filter(c => c.id !== id);
      await metadataService.saveVNPayConfigs(updatedConfigs);
      setConfigs(updatedConfigs);
    } catch (err) {
      throw new Error('Failed to delete configuration');
    }
  };

  const saveChannelMapping = async (channelId: string, configId: string) => {
    try {
      const updatedMappings = { ...channelMappings, [channelId]: configId };
      await metadataService.saveChannelMappings(updatedMappings);
      setChannelMappings(updatedMappings);
    } catch (err) {
      throw new Error('Failed to save channel mapping');
    }
  };

  return {
    configs,
    channelMappings,
    loading,
    error,
    saveConfig,
    deleteConfig,
    saveChannelMapping,
    refetch: fetchData,
  };
}
