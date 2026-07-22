/**
 * File:        apps/api/src/graphql/plugins/complexity.plugin.ts
 * Module:      API · GraphQL · Plugins
 * Purpose:     Apollo server plugin that rejects queries whose estimated
 *              complexity (using `graphql-query-complexity`) exceeds a
 *              per-request budget. Stops a single GraphQL request from
 *              joining the whole database.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-21
 */
import { ApolloServerPlugin, GraphQLRequestListener } from '@apollo/server';
import { GraphQLSchema } from 'graphql';
import { fieldExtensionsEstimator, simpleEstimator, createComplexityRule } from 'graphql-query-complexity';

export interface ComplexityPluginOptions {
  schema: GraphQLSchema;
  /** Maximum total complexity a single request is allowed to spend. */
  maxCost: number;
  /**
   * Per-field cost, applied via `fieldExtensionsEstimator` for fields that
   * opt-in with `@Cost(...)`. The estimator falls back to `simpleEstimator`
   * which gives every field a flat 1 unless extended.
   */
  defaultCost?: number;
}

export function complexityPlugin(options: ComplexityPluginOptions): ApolloServerPlugin {
  const { schema, maxCost, defaultCost = 1 } = options;
  return {
    async requestDidStart(): Promise<GraphQLRequestListener<any>> {
      return {
        async didResolveOperation({ request, document }: any) {
          const rule = createComplexityRule({
            maximumComplexity: maxCost,
            estimators: [
              fieldExtensionsEstimator(),
              simpleEstimator({ defaultComplexity: defaultCost }),
            ],
            onComplete: (complexity: number) => {
              // We could log this; the plugin is already blocking the query
              // if it exceeds the limit, so this only fires for accepted ones.
              if (process.env.GRAPHQL_DEBUG === '1') {
                // eslint-disable-next-line no-console
                console.log(
                  `[complexity] op=${request.operationName ?? 'anon'} cost=${complexity}`,
                );
              }
            },
          });
          // Apollo 4 doesn't expose ValidationRules directly via the listener
          // type, so we re-validate using the rule when the listener fires.
          // In practice NestJS + Apollo 4 lets us pass validation rules through
          // the GraphQLModule config; this plugin only logs and the validation
          // rules (registered separately) are what actually reject the query.
          // We do run validate() here for explicit introspection.
          const { validate } = await import('graphql');
          const errors = validate(schema, document, [rule]);
          if (errors.length > 0) {
            throw errors[0];
          }
        },
      };
    },
  };
}
