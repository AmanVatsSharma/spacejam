import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'http://localhost:3001/api/graphql',
  documents: 'src/lib/apollo/operations.ts',
  generates: {
    'src/__generated__/graphql.ts': {
      plugins: ['typescript', 'typescript-operations'],
    },
  },
};

export default config;
