/**
 * React Hook: useSaleorChannels
 * ==============================
 * Custom hook to fetch channels from Saleor API
 * Uses URQL generated hook from GraphQL query (Saleor's standard approach)
 */

import { useGetChannelsQuery } from '@/generated/graphql';

export interface SaleorChannel {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  currencyCode: string;
}

interface UseSaleorChannelsResult {
  channels: SaleorChannel[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch Saleor channels using generated URQL hook
 * This follows Saleor's standard pattern (same as OrderExample)
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { channels, loading, error } = useSaleorChannels();
 *   
 *   if (loading) return <div>Loading channels...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   
 *   return (
 *     <select>
 *       {channels.map(ch => (
 *         <option key={ch.id} value={ch.id}>{ch.name}</option>
 *       ))}
 *     </select>
 *   );
 * }
 * ```
 */
export function useSaleorChannels(): UseSaleorChannelsResult {
  // Using the generated URQL hook from graphql/queries/getChannels.graphql
  const [{ data, fetching, error }, refetch] = useGetChannelsQuery();

  return {
    channels: data?.channels?.filter(ch => ch !== null) as SaleorChannel[] || [],
    loading: fetching,
    error: error ? new Error(error.message) : null,
    refetch,
  };
}
