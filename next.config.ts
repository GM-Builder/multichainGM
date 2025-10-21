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
      // Allow Farcaster to frame /farcaster pages
      {
        source: '/farcaster',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors *", // ✅ Allow ALL for testing
          },
        ],
      },
      {
        source: '/farcaster/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors *", // ✅ Allow ALL for testing
          },
        ],
      },
      // Protect other pages
      {
        source: '/((?!farcaster).*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },
  
  async redirects() {
    return [
      // Redirect www to non-www
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.gannetx.space',
          },
        ],
        destination: 'https://gannetx.space/:path*',
        permanent: true,
      },
      // Farcaster manifest redirect
      {
        source: '/.well-known/farcaster.json',
        destination: 'https://api.farcaster.xyz/miniapps/hosted-manifest/019a04eb-5297-ed7a-811e-77ff01276024',
        permanent: false,
      },
    ];
  },
  
  reactStrictMode: true,
  swcMinify: true,
  
  experimental: {
    turbo: false,
    optimizePackageImports: ['@thirdweb-dev/react', 'ethers', '@farcaster/miniapp-sdk'],
  },
  
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  output: 'standalone',
  poweredByHeader: false,
  
  typescript: {
    ignoreBuildErrors: true,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  transpilePackages: ['ethers', '@farcaster/miniapp-sdk'],
};

module.exports = nextConfig;