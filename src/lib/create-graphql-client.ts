/**
 * Helper to create URQL GraphQL client for Saleor API
 */

import { createClient as createUrqlClient, Client, fetchExchange } from "urql";

export interface CreateClientOptions {
  headers?: Record<string, string>;
}

export function createClient(
  saleorApiUrl: string,
  options: CreateClientOptions = {}
): Client {
  return createUrqlClient({
    url: saleorApiUrl,
    exchanges: [fetchExchange],
    fetchOptions: {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    },
  });
}
