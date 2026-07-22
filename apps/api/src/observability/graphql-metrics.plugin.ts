/**
 * File:        apps/api/src/observability/graphql-metrics.plugin.ts
 * Module:      API · Observability · GraphQL Metrics
 * Purpose:     Apollo plugin that records GraphQL operation counts and
 *              durations into Prometheus. The plugin runs on every
 *              GraphQL request, extracts the operation name / type from
 *              the document, and ticks the right counter / histogram.
 *
 *              Why an Apollo plugin (and not a Nest interceptor):
 *              Apollo's plugin lifecycle hooks (`requestDidStart` /
 *              `didResolveOperation` / `didEncounterErrors`) give us
 *              operation name + type + timing for free. Nest
 *              interceptors can't see GraphQL operation metadata.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-21
 */
import { ApolloServerPlugin, GraphQLRequestListener } from '@apollo/server';
import { GraphQLError } from 'graphql';
import { MetricsService } from './metrics.service';

function opType(doc: any): string {
  const def = doc?.definitions?.find((d: any) => d.kind === 'OperationDefinition');
  return def?.operation ?? 'unknown';
}

function opName(doc: any): string {
  const def = doc?.definitions?.find((d: any) => d.kind === 'OperationDefinition');
  return (def?.name?.value as string) ?? 'anonymous';
}

export function createGraphqlMetricsPlugin(metrics: MetricsService): ApolloServerPlugin {
  return {
    async requestDidStart(): Promise<GraphQLRequestListener<any>> {
      const startedAt = process.hrtime.bigint();
      return {
        async didResolveOperation(ctx: any) {
          const doc = (ctx.document as any) ?? (ctx.request as any)?.document;
          const operationType = opType(doc);
          const operation = opName(doc);
          metrics.graphqlOperationsTotal.inc({
            operation,
            operation_type: operationType,
            result: 'success',
          });
          const seconds = Number(process.hrtime.bigint() - startedAt) / 1e9;
          metrics.graphqlOperationDuration.observe(
            { operation, operation_type: operationType },
            seconds,
          );
        },
        async didEncounterErrors(ctx: any) {
          const errors: ReadonlyArray<GraphQLError> = ctx.errors ?? [];
          const doc = (ctx.document as any) ?? (ctx.request as any)?.document;
          const operationType = opType(doc);
          const operation = opName(doc);
          const result = errors.length > 0 ? 'error' : 'success';
          metrics.graphqlOperationsTotal.inc({
            operation,
            operation_type: operationType,
            result,
          });
        },
      };
    },
  };
}