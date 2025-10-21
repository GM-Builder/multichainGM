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
      // Redirect www to non-www
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.gannetx.space',
          },
        ],
        headers: [
          {
            key: 'Location',
            value: 'https://gannetx.space/:path*',
          },
        ],
      },
      
      // Headers for NON-Farcaster pages (DENY framing)
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
      
      // Headers for Farcaster Mini App pages (ALLOW framing)
      {
        source: '/farcaster/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOW-FROM https://warpcast.com', // ❌ Ganti dari ALLOWALL
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "frame-ancestors 'self' https://*.farcaster.xyz https://*.warpcast.com https://warpcast.com https://*.neynar.com",
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://esm.sh https://cdn.jsdelivr.net https://www.googletagmanager.com https://vercel.live",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://*.farcaster.xyz https://*.warpcast.com https://*.neynar.com https://pulse.walletconnect.network https://*.vercel.app wss://*",
              "frame-src 'self' https://*.farcaster.xyz https://*.warpcast.com",
            ].join('; '),
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
      
      // Also for exact /farcaster path
      {
        source: '/farcaster',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOW-FROM https://warpcast.com',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "frame-ancestors 'self' https://*.farcaster.xyz https://*.warpcast.com https://warpcast.com https://*.neynar.com",
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://esm.sh https://cdn.jsdelivr.net https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://*.farcaster.xyz https://*.warpcast.com https://*.neynar.com https://pulse.walletconnect.network wss://*",
              "frame-src 'self' https://*.farcaster.xyz https://*.warpcast.com",
            ].join('; '),
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