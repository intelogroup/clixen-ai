/** @type {import('next').NextConfig} */

// Bundle analyzer for performance tracking
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  // Server external packages for better performance
  serverExternalPackages: ['@prisma/client'],
  
  // Enable experimental features for better performance
  experimental: {
    // Optimize package imports for smaller bundles
    optimizePackageImports: [
      '@radix-ui/react-icons',
      '@radix-ui/react-avatar',
      '@radix-ui/react-dialog', 
      '@radix-ui/react-label',
      '@radix-ui/react-progress',
      '@radix-ui/react-separator',
      '@radix-ui/react-slot',
      'lucide-react'
    ],
  },

  // Webpack configuration for performance optimization
  webpack: (config, { dev, isServer }) => {
    // Development optimizations
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

    // Production bundle optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\/\\]node_modules[\/\\]/,
              name: 'vendors',
              priority: 10,
              reuseExistingChunk: true,
            },
            common: {
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
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

  // SWC minification is enabled by default in Next.js 15+
  
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
    swcMinify: true, // Use SWC for faster minification
    
    // Image optimization with performance focus
    images: {
      formats: ['image/webp', 'image/avif'],
      minimumCacheTTL: 3600, // Cache for 1 hour
      deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
      imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },
    
    // Additional performance optimizations
    compiler: {
      removeConsole: true, // Remove console.log in production
    },
  }),
}

export default withBundleAnalyzer(nextConfig)
