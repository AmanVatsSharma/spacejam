#!/bin/bash
curl -X POST http://localhost:3001/api/graphql -H "Content-Type: application/json" -d '{"query": "{ __schema { types { name } } }"}'
echo ""
curl -X POST http://localhost:3001/graphql -H "Content-Type: application/json" -d '{"query": "{ __schema { types { name } } }"}'
