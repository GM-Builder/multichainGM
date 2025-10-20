/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'assets.coingecko.com', 
      'logos.covalenthq.com',
      // Tambahan untuk Farcaster
      'i.imgur.com',
      'imagedelivery.net',
    ],
  },
  
  // Webpack configuration
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
    
    // Ignore node-specific modules in browser
    config.resolve.alias = {
      ...config.resolve.alias,
      'pino-pretty': false,
    };
    
    return config;
  },
  
  // Headers configuration - UPDATED untuk Farcaster
  async headers() {
    return [
      {
        // Regular pages
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
        // Farcaster pages - Allow embedding
        source: '/farcaster/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL', // Allow Farcaster to embed
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