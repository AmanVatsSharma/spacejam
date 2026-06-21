/**
 * File:        apps/api/src/graphql/plugins/depth-limit.plugin.ts
 * Module:      API · GraphQL · Plugins
 * Purpose:     Cap query depth so a deeply-nested GraphQL query can't
 *              request absurdly-long traversal paths. Returns validation
 *              errors that NestJS surfaces to the client.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-21
 */
import { ApolloServerPlugin, GraphQLRequestListenerValidationDidStart } from '@apollo/server';
import { GraphQLSchema } from 'graphql';
import depthLimit from 'graphql-depth-limit';

export interface DepthLimitPluginOptions {
  schema: GraphQLSchema;
  /** Maximum allowed nesting depth. Default 8. */
  maxDepth?: number;
  /**
   * When true, ignore computed depth for fields tagged with
   * `@depthLimit(ignore: true)`. Reserved for future schema-directive use.
   */
  ignore?: string[];
}

export function depthLimitPlugin(options: DepthLimitPluginOptions): ApolloServerPlugin {
  const maxDepth = options.maxDepth ?? 8;
  return {
    async requestDidStart(): Promise<GraphQLRequestListenerValidationDidStart> {
      return {
        async didResolveOperation({ request, document }) {
          const rule = depthLimit(maxDepth, options.ignore ?? [], { debug: false });
          const { validate } = await import('graphql');
          const errors = validate(options.schema, document, [rule]);
          if (errors.length > 0) {
            throw errors[0];
          }
          if (process.env.GRAPHQL_DEBUG === '1') {
            // eslint-disable-next-line no-console
            console.log(`[depth] op=${request.operationName ?? 'anon'} allowed<=${maxDepth}`);
          }
        },
      };
    },
  };
}
