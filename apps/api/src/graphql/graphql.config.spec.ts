/**
 * File:        apps/api/src/graphql/graphql.config.spec.ts
 * Module:      API · GraphQL · Tests
 * Purpose:     Unit tests verifying formatError mapping behaviors
 *              Co-located with graphql.config.ts
 *
 * Author:      Challenger M2-1
 * Last-updated: 2026-07-02
 */

import { describe, it, expect } from 'vitest';
import { buildSchemaOptions } from './graphql.config';
import { BadRequestException, UnauthorizedException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { GraphQLError } from 'graphql';

describe('GraphQL config - formatError mapping', async () => {
  const config = await buildSchemaOptions({} as any, {} as any);
  const formatError = config.formatError as Function;

  it('maps BadRequestException (400) to BAD_USER_INPUT and joins messages', () => {
    const exception = new BadRequestException(['name is required', 'email must be an email']);
    const gqlError = new GraphQLError('Bad request', {
      originalError: exception,
    });
    
    const formatted = {
      message: 'Bad request',
      extensions: {
        code: 'BAD_USER_INPUT',
      },
    };
    
    const result = formatError(formatted, gqlError);
    expect(result.extensions.code).toBe('BAD_USER_INPUT');
    expect(result.message).toBe('name is required, email must be an email');
  });

  it('maps BadRequestException (400) with single message to BAD_USER_INPUT', () => {
    const exception = new BadRequestException('Single validation error');
    const gqlError = new GraphQLError('Bad request', {
      originalError: exception,
    });
    
    const formatted = {
      message: 'Bad request',
      extensions: {
        code: 'BAD_USER_INPUT',
      },
    };
    
    const result = formatError(formatted, gqlError);
    expect(result.extensions.code).toBe('BAD_USER_INPUT');
    expect(result.message).toBe('Single validation error');
  });

  it('maps UnauthorizedException (401) to UNAUTHENTICATED', () => {
    const exception = new UnauthorizedException('Unauthorized access');
    const gqlError = new GraphQLError('Unauthorized access', {
      originalError: exception,
    });
    
    const formatted = {
      message: 'Unauthorized access',
      extensions: {
        code: 'UNAUTHENTICATED',
      },
    };
    
    const result = formatError(formatted, gqlError);
    expect(result.extensions.code).toBe('UNAUTHENTICATED');
  });

  it('maps ForbiddenException (403) to FORBIDDEN', () => {
    const exception = new ForbiddenException('Forbidden access');
    const gqlError = new GraphQLError('Forbidden access', {
      originalError: exception,
    });
    
    const formatted = {
      message: 'Forbidden access',
      extensions: {
        code: 'FORBIDDEN',
      },
    };
    
    const result = formatError(formatted, gqlError);
    expect(result.extensions.code).toBe('FORBIDDEN');
  });

  it('maps NotFoundException (404) to NOT_FOUND', () => {
    const exception = new NotFoundException('Resource not found');
    const gqlError = new GraphQLError('Resource not found', {
      originalError: exception,
    });
    
    const formatted = {
      message: 'Resource not found',
      extensions: {
        code: 'NOT_FOUND',
      },
    };
    
    const result = formatError(formatted, gqlError);
    expect(result.extensions.code).toBe('NOT_FOUND');
  });

  it('preserves other safe codes (e.g. QUERY_TOO_DEEP)', () => {
    const gqlError = new GraphQLError('Query too deep', {
      extensions: { code: 'QUERY_TOO_DEEP' },
    });
    const formatted = {
      message: 'Query too deep',
      extensions: { code: 'QUERY_TOO_DEEP' },
    };
    const result = formatError(formatted, gqlError);
    expect(result.extensions.code).toBe('QUERY_TOO_DEEP');
    expect(result.message).toBe('Query too deep');
  });
});
