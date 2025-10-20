/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'assets.coingecko.com', 
      'logos.covalenthq.com',
      'i.imgur.com',
      'imagedelivery.net',
      'api.dicebear.com',
    ],
  },
  
  webpack: (config: { resolve: { fallback: any; alias: any; }; externals: string[]; }, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }
    
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    
    config.resolve.alias = {
      ...config.resolve.alias,
      'pino-pretty': false,
    };
    
    return config;
  },
  
  async headers() {
    return [
      {
        source: '/((?!farcaster).*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/farcaster/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL', 
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.farcaster.xyz https://*.warpcast.com https://warpcast.com",
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Next.js configuration
  reactStrictMode: true,
  swcMinify: true,
  
  // Experimental features
  experimental: {
    turbo: false,
    // Improve hydration performance
    optimizePackageImports: ['@thirdweb-dev/react', 'ethers', '@farcaster/frame-sdk'],
  },
  
  // Compiler options
  compiler: {
    // Remove console.logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Output configuration
  output: 'standalone',
  
  // Disable powered by header
  poweredByHeader: false,
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: true, // Keep true for development
  },
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: true, // Keep true for development
  },
  
  // Transpile packages
  transpilePackages: ['ethers', '@farcaster/frame-sdk'],
};

module.exports = nextConfig;