/**
 * File:        apps/api/src/graphql/graphql.config.ts
 * Module:      API · GraphQL
 * Purpose:     Builds the GraphQLModule config object that wires up
 *              complexity limits, depth limits, error masking, and
 *              per-request DataLoaders. Centralized here so the
 *              AppModule doesn't grow into a 200-line file.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-21
 */
import { ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLError, BuildSchemaOptions } from 'graphql';
import { DataSource } from 'typeorm';

import { GqlDataLoaders } from './dataloaders';

const MAX_COMPLEXITY = parseInt(process.env.GRAPHQL_MAX_COMPLEXITY ?? '1000', 10);
const MAX_DEPTH = parseInt(process.env.GRAPHQL_MAX_DEPTH ?? '8', 10);
const MASK_ERRORS =
  process.env.NODE_ENV === 'production' || process.env.GRAPHQL_MASK_ERRORS === '1';

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

/**
 * Factory signature compatible with NestJS `useFactory`. We take
 * `DataSource` as a dependency so we can pull repos from a single
 * shared connection rather than maintaining our own pool.
 */
export async function buildSchemaOptions(dataSource: DataSource): Promise<ApolloDriverConfig> {
  let schema: ReturnType<typeof import('graphql').buildSchema> | null = null;
  try {
    const fs = await import('fs');
    const path = await import('path');
    const schemaPath = path.join(process.cwd(), 'apps', 'api', 'src', 'schema.gql');
    if (fs.existsSync(schemaPath)) {
      const typeDefs = fs.readFileSync(schemaPath, 'utf8');
      const { buildSchema } = await import('graphql');
      schema = buildSchema(typeDefs);
    }
  } catch {
    // best-effort
  }

  const validationRules = schema
    ? await buildValidationRules(schema, MAX_COMPLEXITY, MAX_DEPTH)
    : [];

  return {
    autoSchemaFile: true,
    sortSchema: true,
    playground: process.env.NODE_ENV !== 'production',
    introspection: process.env.NODE_ENV !== 'production',
    validationRules,
    context: async ({ req, res, connectionParams, extra }: any) => {
      const loaders = buildRequestLoaders(dataSource);
      return { req, res, connectionParams, extra, loaders };
    },
    subscriptions: {
      'graphql-ws': {
        onConnect: (context: any) => {
          const params = context.connectionParams ?? {};
          const auth = (params.Authorization || params.authorization) as string | undefined;
          if (auth && typeof auth === 'string' && auth.startsWith('Bearer ')) {
            return { token: auth.slice(7) };
          }
          return true;
        },
      },
    },
    formatError: (formatted) => {
      if (!MASK_ERRORS) return formatted;
      const code = (formatted.extensions?.code as string) || 'INTERNAL_SERVER_ERROR';
      if (SAFE_CODES.has(code)) return formatted;
      return {
        message: 'Internal server error',
        path: formatted.path,
        locations: formatted.locations,
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      };
    },
  } as ApolloDriverConfig;
}

async function buildValidationRules(
  schema: NonNullable<Parameters<typeof buildSchema>[0]> extends string
    ? ReturnType<typeof import('graphql').buildSchema>
    : never,
  maxComplexity: number,
  maxDepth: number,
) {
  const { createComplexityLimitRule, fieldExtensionsEstimator, simpleEstimator } =
    await import('graphql-query-complexity');
  const depthLimit = (await import('graphql-depth-limit')).default;
  return [
    createComplexityLimitRule(maxComplexity, {
      estimators: [fieldExtensionsEstimator(), simpleEstimator({ defaultComplexity: 1 })],
      schema,
      createError: (cost, max) =>
        new GraphQLError(
          `Query is too complex: ${cost}. Maximum allowed complexity is ${max}.`,
          { extensions: { code: 'COMPLEXITY_LIMIT_EXCEEDED', cost, max } },
        ),
    }),
    depthLimit(maxDepth),
  ];
}

function buildRequestLoaders(dataSource: DataSource): GqlDataLoaders {
  if (!dataSource?.isInitialized) {
    return new GqlDataLoaders(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
  }
  const { User } = require('../typeorm/entities/user.entity') as typeof import('../typeorm/entities/user.entity');
  const { Center } = require('../typeorm/entities/center.entity') as typeof import('../typeorm/entities/center.entity');
  const { Seat } = require('../typeorm/entities/seat.entity') as typeof import('../typeorm/entities/seat.entity');
  const { Booking } = require('../typeorm/entities/booking.entity') as typeof import('../typeorm/entities/booking.entity');
  return new GqlDataLoaders(
    dataSource.getRepository(User),
    dataSource.getRepository(Center),
    dataSource.getRepository(Seat),
    dataSource.getRepository(Booking),
  );
}

export type { BuildSchemaOptions };