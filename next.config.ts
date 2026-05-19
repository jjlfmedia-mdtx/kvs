import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['c2pa-node', 'pdfkit', 'sharp', 'piexifjs', 'crypto', 'child_process']
};

export default nextConfig;
