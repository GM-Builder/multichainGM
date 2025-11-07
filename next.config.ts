/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['assets.coingecko.com', 'logos.covalenthq.com'],
  },
  
  webpack: (config: { resolve: { fallback: any; alias: any; }; externals: string[]; }) => {
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
        source: '/(.*)',
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
    ];
  },
  
  reactStrictMode: true,
  
  experimental: {
    appDir: true,
    
    optimizePackageImports: ['@thirdweb-dev/react', 'ethers'],
  },
  
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  swcMinify: true,
  
  output: 'standalone',
  
  poweredByHeader: false,
  
  env: {
    CUSTOM_KEY: 'custom-value',
  },
  
  typescript: {
    ignoreBuildErrors: false,
  },
  
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;