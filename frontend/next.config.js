/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for better stability
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons']
  },

  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Fix for webpack HMR issues
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      }
      
      // Improve HMR stability
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
      }
    }

    // Handle ESM modules properly
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return config
  },

  // Environment variables
  env: {
    CUSTOM_KEY: 'my-value',
  },

  // Headers for better CORS handling
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ]
      }
    ]
  },

  // Redirects for better UX
  async redirects() {
    return [
      {
        source: '/test',
        destination: '/test-supabase',
        permanent: false,
      },
    ]
  },

  // Improve build performance
  swcMinify: true,
  
  // Better error handling
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },

  // Development improvements
  ...(process.env.NODE_ENV === 'development' && {
    // Disable type checking during development for speed
    typescript: {
      ignoreBuildErrors: false,
    },
    eslint: {
      ignoreDuringBuilds: false,
    },
  }),

  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    // Enable production optimizations
    compress: true,
    poweredByHeader: false,
    generateEtags: false,
    
    // Image optimization
    images: {
      formats: ['image/webp', 'image/avif'],
      minimumCacheTTL: 60,
    },
  }),
}

export default nextConfig
