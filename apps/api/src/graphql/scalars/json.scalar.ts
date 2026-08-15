/**
 * File:        graphql/scalars/json.scalar.ts
 * Module:      API · GraphQL Scalars
 * Purpose:     A passthrough JSON scalar. Entity jsonb columns (e.g.
 *              Center.settings) hold plain objects, but the default GraphQL
 *              String scalar refuses to serialize objects — which crashed
 *              every `myCenters { settings }` query as soon as a center had
 *              any settings saved. This scalar serializes objects/arrays
 *              verbatim and leaves other values untouched.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-14
 */
import { GraphQLScalarType, Kind } from 'graphql';

function parse(value: unknown): unknown {
  return value;
}

export const JsonScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'Arbitrary JSON value, stored and returned as-is (jsonb passthrough)',

  serialize: (value: unknown) => value,

  parseValue: parse,

  parseLiteral(ast: any): unknown {
    if (ast.kind === Kind.STRING) {
      try {
        return JSON.parse(ast.value);
      } catch {
        return ast.value;
      }
    }
    if (ast.kind === Kind.OBJECT) {
      const out: Record<string, unknown> = {};
      for (const field of ast.fields) out[field.name.value] = parseLiteral(field.value);
      return out;
    }
    if (ast.kind === Kind.LIST) return ast.values.map(parseLiteral);
    if (ast.kind === Kind.INT) return Number(ast.value);
    if (ast.kind === Kind.FLOAT) return Number(ast.value);
    if (ast.kind === Kind.BOOLEAN) return ast.value;
    return null;
  },
});
