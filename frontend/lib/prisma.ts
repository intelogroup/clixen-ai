import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Environment-specific configuration for optimal performance
const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

export const prisma = 
  globalForPrisma.prisma ??
  new PrismaClient({
    // Log configuration based on environment
    log: isDevelopment 
      ? ['query', 'info', 'warn', 'error'] 
      : ['error'],
    
    // Error formatting - pretty for dev, minimal for production
    errorFormat: isDevelopment ? 'pretty' : 'minimal',
    
    // Connection optimization
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

// Connection event handlers for monitoring
prisma.$on('query', (e) => {
  // Log slow queries in development
  if (isDevelopment && e.duration > 1000) {
    console.warn(`🐌 Slow query detected: ${e.duration}ms\nQuery: ${e.query}`)
  }
})

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Disconnecting Prisma client...')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('🔄 Disconnecting Prisma client...')
  await prisma.$disconnect()
  process.exit(0)
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma