import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Custom log levels for authentication system
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    auth: 3,
    debug: 4,
    trace: 5
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'blue',
    auth: 'green',
    debug: 'cyan',
    trace: 'magenta'
  }
};

// Custom format for structured logging
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'HH:mm:ss.SSS'
  }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `[${timestamp}] ${level}: ${message} ${metaString}`;
  })
);

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');

// Create Winston logger instance
const logger = winston.createLogger({
  levels: customLevels.levels,
  level: process.env.NODE_ENV === 'production' ? 'info' : 'trace',
  format: customFormat,
  defaultMeta: { 
    service: 'clixen-auth',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Error logs - separate file
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true
    }),
    
    // Authentication specific logs
    new DailyRotateFile({
      filename: path.join(logsDir, 'auth-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'auth',
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true
    }),
    
    // All logs combined
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true
    }),
    
    // Console output for development
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'trace'
    })
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '7d'
    })
  ],
  
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '7d'
    })
  ]
});

// Add colors to Winston
winston.addColors(customLevels.colors);

// Authentication-specific logger methods
export const authLogger = {
  // Authentication events
  authAttempt: (data: { 
    method: string; 
    email?: string; 
    provider?: string; 
    userAgent?: string; 
    ip?: string; 
  }) => {
    logger.log('auth', 'Authentication attempt started', {
      event: 'auth_attempt',
      ...data,
      timestamp: new Date().toISOString()
    });
  },
  
  authSuccess: (data: { 
    method: string; 
    userId?: string; 
    email?: string; 
    provider?: string;
    duration?: number;
  }) => {
    logger.log('auth', 'Authentication successful', {
      event: 'auth_success',
      ...data,
      timestamp: new Date().toISOString()
    });
  },
  
  authFailure: (data: { 
    method: string; 
    email?: string; 
    provider?: string;
    error: string;
    reason?: string;
    duration?: number;
  }) => {
    logger.log('auth', 'Authentication failed', {
      event: 'auth_failure',
      ...data,
      timestamp: new Date().toISOString()
    });
  },
  
  // Form validation events
  formValidation: (data: {
    field: string;
    valid: boolean;
    error?: string;
    value?: string;
  }) => {
    logger.debug('Form validation', {
      event: 'form_validation',
      ...data,
      // Never log actual passwords
      value: data.field === 'password' ? '[REDACTED]' : data.value,
      timestamp: new Date().toISOString()
    });
  },
  
  // OAuth events
  oauthRedirect: (data: {
    provider: string;
    state?: string;
    redirectUrl: string;
  }) => {
    logger.log('auth', 'OAuth redirect initiated', {
      event: 'oauth_redirect',
      ...data,
      timestamp: new Date().toISOString()
    });
  },
  
  oauthCallback: (data: {
    provider: string;
    success: boolean;
    error?: string;
    code?: string;
  }) => {
    logger.log('auth', 'OAuth callback received', {
      event: 'oauth_callback',
      ...data,
      // Don't log actual OAuth codes
      code: data.code ? '[PRESENT]' : undefined,
      timestamp: new Date().toISOString()
    });
  },
  
  // Session events
  sessionCreated: (data: {
    userId: string;
    sessionId?: string;
    method: string;
  }) => {
    logger.log('auth', 'Session created', {
      event: 'session_created',
      ...data,
      timestamp: new Date().toISOString()
    });
  },
  
  sessionDestroyed: (data: {
    userId?: string;
    sessionId?: string;
    reason: string;
  }) => {
    logger.log('auth', 'Session destroyed', {
      event: 'session_destroyed',
      ...data,
      timestamp: new Date().toISOString()
    });
  }
};

// Test logger methods
export const testLogger = {
  testStart: (testName: string, metadata?: any) => {
    logger.info('Test started', {
      event: 'test_start',
      testName,
      ...metadata,
      timestamp: new Date().toISOString()
    });
  },
  
  testEnd: (testName: string, result: 'pass' | 'fail' | 'warning', metadata?: any) => {
    const level = result === 'fail' ? 'error' : result === 'warning' ? 'warn' : 'info';
    logger.log(level, 'Test completed', {
      event: 'test_end',
      testName,
      result,
      ...metadata,
      timestamp: new Date().toISOString()
    });
  },
  
  stepStart: (step: string, metadata?: any) => {
    logger.debug('Test step started', {
      event: 'step_start',
      step,
      ...metadata,
      timestamp: new Date().toISOString()
    });
  },
  
  stepEnd: (step: string, success: boolean, metadata?: any) => {
    logger.debug('Test step completed', {
      event: 'step_end',
      step,
      success,
      ...metadata,
      timestamp: new Date().toISOString()
    });
  },
  
  assertion: (description: string, passed: boolean, expected?: any, actual?: any) => {
    const level = passed ? 'debug' : 'error';
    logger.log(level, 'Test assertion', {
      event: 'assertion',
      description,
      passed,
      expected,
      actual,
      timestamp: new Date().toISOString()
    });
  }
};

// Performance logger
export const perfLogger = {
  timing: (operation: string, duration: number, metadata?: any) => {
    logger.info('Performance timing', {
      event: 'performance_timing',
      operation,
      duration,
      unit: 'ms',
      ...metadata,
      timestamp: new Date().toISOString()
    });
  },
  
  metric: (name: string, value: number, unit: string, metadata?: any) => {
    logger.info('Performance metric', {
      event: 'performance_metric',
      name,
      value,
      unit,
      ...metadata,
      timestamp: new Date().toISOString()
    });
  }
};

// Error logger with context
export const errorLogger = {
  critical: (message: string, error: Error, context?: any) => {
    logger.error('Critical error', {
      event: 'critical_error',
      message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context,
      timestamp: new Date().toISOString()
    });
  },
  
  handled: (message: string, error: Error, context?: any) => {
    logger.warn('Handled error', {
      event: 'handled_error',
      message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context,
      timestamp: new Date().toISOString()
    });
  }
};

// Utility logger
export const utilLogger = {
  apiCall: (method: string, url: string, statusCode?: number, duration?: number) => {
    logger.debug('API call', {
      event: 'api_call',
      method,
      url,
      statusCode,
      duration,
      timestamp: new Date().toISOString()
    });
  },
  
  databaseOperation: (operation: string, table?: string, duration?: number) => {
    logger.debug('Database operation', {
      event: 'db_operation',
      operation,
      table,
      duration,
      timestamp: new Date().toISOString()
    });
  }
};

// Main logger export
export default logger;

// Helper functions for common patterns
export const withLogging = <T extends (...args: any[]) => any>(
  fn: T,
  operationName: string
): T => {
  return ((...args: Parameters<T>) => {
    const start = Date.now();
    logger.debug(`Starting operation: ${operationName}`, { args });
    
    try {
      const result = fn(...args);
      
      // Handle promises
      if (result instanceof Promise) {
        return result
          .then((data) => {
            const duration = Date.now() - start;
            logger.debug(`Operation completed: ${operationName}`, { duration });
            return data;
          })
          .catch((error) => {
            const duration = Date.now() - start;
            logger.error(`Operation failed: ${operationName}`, { 
              error: error.message,
              duration 
            });
            throw error;
          });
      }
      
      // Handle synchronous functions
      const duration = Date.now() - start;
      logger.debug(`Operation completed: ${operationName}`, { duration });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error(`Operation failed: ${operationName}`, { 
        error: error instanceof Error ? error.message : String(error),
        duration 
      });
      throw error;
    }
  }) as T;
};