/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: "/3d-4d111",
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.worker\.ts$/,
      use: { loader: 'worker-loader' }
    });
    return config;
  },
  experimental: {
    optimizePackageImports: ['three', '@react-three/fiber', '@react-three/drei']
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
