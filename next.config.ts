import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['c2pa-node', 'pdfkit', 'sharp', 'piexifjs', 'crypto', 'child_process'],
  outputFileTracingIncludes: {
    '/api/**/*': [
      './node_modules/**/*.wasm',
      './node_modules/**/*.node',
      './node_modules/c2pa-node/**/*',
      './node_modules/@contentauth/c2pa-node/**/*'
    ]
  }
};

export default nextConfig;
