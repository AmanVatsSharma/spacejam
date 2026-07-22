/**
 * File:        apps/api/src/graphql/plugins/error-mask.plugin.ts
 * Module:      API · GraphQL · Plugins
 * Purpose:     Apollo plugin that masks internal error details (stack
 *              traces, originalError) from client responses, except for
 *              GraphQL `extensions.code` values that are explicitly
 *              whitelisted as safe to surface.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-21
 */
import { ApolloServerPlugin, GraphQLRequestListener } from '@apollo/server';
import { GraphQLError } from 'graphql';

/**
 * Codes that we DO want to leak to clients (because they're already part
 * of the public contract — a wrong password, an invalid token, etc.).
 */
const SAFE_CODES = new Set([
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'BAD_USER_INPUT',
  'GRAPHQL_VALIDATION_FAILED',
  'PERSISTED_QUERY_NOT_FOUND',
  'PERSISTED_QUERY_NOT_SUPPORTED',
  'OPERATION_RESOLUTION_FAILURE',
  'COMPLEXITY_LIMIT_EXCEEDED',
  'QUERY_TOO_DEEP',
  'TOO_MANY_REQUESTS',
]);

export interface ErrorMaskPluginOptions {
  /** When true (default in production), errors are masked. */
  enabled: boolean;
  /** Whether to log the unmasked error server-side. */
  logOriginal?: boolean;
}

export function errorMaskPlugin(options: ErrorMaskPluginOptions): ApolloServerPlugin {
  const { enabled, logOriginal = true } = options;
  return {
    async requestDidStart(): Promise<GraphQLRequestListener<any>> {
      return {
        async willSendResponse({ errors, contextValue }: any) {
          if (!enabled || !errors || errors.length === 0) return;
          const masked = errors.map((err: any) => {
            if (logOriginal) {
              const logger = (contextValue as any)?.logger;
              if (logger) {
                logger.error?.('[graphql]', {
                  message: err.message,
                  path: err.path,
                  extensions: err.extensions,
                });
              }
            }
            const code = (err.extensions?.code as string) || 'INTERNAL_SERVER_ERROR';
            if (SAFE_CODES.has(code)) return err;
            return new GraphQLError('Internal server error', {
              nodes: err.nodes,
              source: err.source,
              positions: err.positions,
              path: err.path,
              originalError: undefined,
              extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
          });
          // Mutate the array in place to preserve the response shape.
          errors.length = 0;
          errors.push(...masked);
        },
      };
    },
  };
}
