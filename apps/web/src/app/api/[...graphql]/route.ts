/**
 * File:        apps/web/src/app/api/[...graphql]/route.ts
 * Module:      Web · Next.js API Routes
 * Purpose:     GraphQL proxy route to forward client requests to NestJS backend
 *              Handles both GET and POST methods, sets CORS headers, and forwards
 *              requests to localhost:3001 (NestJS API server)
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-02
 */

import { NextRequest, NextResponse } from 'next/server';

const API_SERVER_URL = 'http://localhost:3001';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const graphqlPath = url.pathname.replace('/api/', '');

  const response = await fetch(`${API_SERVER_URL}/${graphqlPath}`, {
    method: 'GET',
    headers: {
      'Host': API_SERVER_URL.replace(/^https?:\/\//, ''),
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    redirect: 'manual',
  });

  const data = await response.text();
  return new NextResponse(data, {
    status: response.status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const { query, variables, operationName } = JSON.parse(body);

  const response = await fetch(`${API_SERVER_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Host': API_SERVER_URL.replace(/^https?:\/\//, ''),
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': request.headers.get('cookie') || '',
    },
    body: JSON.stringify({
      query,
      variables,
      operationName,
    }),
    redirect: 'manual',
  });

  const data = await response.text();
  return new NextResponse(data, {
    status: response.status,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': response.headers.get('set-cookie') || '',
    },
  });
}

export async function options(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}