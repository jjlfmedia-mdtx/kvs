import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['c2pa-node', 'pdfkit', 'sharp', 'piexifjs', 'crypto', 'child_process'],
  outputFileTracingIncludes: {
    '/api/**/*': [
      './node_modules/c2pa-node/dist/**/*.node',
      './node_modules/c2pa-node/tests/**/*'
    ]
  }
};

export default nextConfig;
