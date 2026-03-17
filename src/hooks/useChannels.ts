/**
 * React Hook: useChannels
 * =======================
 * Custom hook to fetch Saleor channels
 * Replaces hard-coded channel data
 */

import { useEffect, useState } from 'react';
import { SaleorChannel, getChannelsService } from '../lib/saleor/channels-service';

interface UseChannelsResult {
  channels: SaleorChannel[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useChannels(): UseChannelsResult {
  const [channels, setChannels] = useState<SaleorChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchChannels = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const channelsService = getChannelsService();
      const data = await channelsService.getChannels();
      setChannels(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch channels'));
      console.error('Error fetching channels:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  return {
    channels,
    loading,
    error,
    refetch: fetchChannels,
  };
}
