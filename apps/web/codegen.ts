import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema: "../../api/src/graphql/schema.graphql",
  documents: "src/lib/apollo/**/*.ts",
  ignoreNoDocuments: true,
  generates: {
    "src/lib/apollo/generated.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-react-apollo",
      ],
      config: {
        withHooks: true,
        withComponent: false,
        skipTypename: true,
        useTypeImports: true,
      },
    },
  },
};

export default config;
