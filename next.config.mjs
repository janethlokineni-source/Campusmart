/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // helps R3F canvas re-renders
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
      },
    ],
  },
  experimental: {
    // optimize packages if needed
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      const existing = config.externals || [];
      config.externals = [
        ...(Array.isArray(existing) ? existing : [existing]),
        ({ request }, callback) => {
          if (request === 'node:sqlite') {
            return callback(null, 'commonjs node:sqlite');
          }
          return callback();
        },
      ];
    }
    return config;
  },
};

export default nextConfig;

