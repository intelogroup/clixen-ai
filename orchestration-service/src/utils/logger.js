const winston = require('winston');

const createLogger = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: { 
      service: 'telegram-orchestrator',
      version: '1.0.0'
    },
    transports: [
      // Write all logs with importance level of 'error' or less to 'error.log'
      new winston.transports.File({ 
        filename: 'logs/error.log', 
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }),
      // Write all logs with importance level of 'info' or less to 'combined.log'
      new winston.transports.File({ 
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      })
    ],
  });

  // If not in production, log to console with simple format
  if (!isProduction) {
    logger.add(new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
          return `${timestamp} [${level}] ${service}: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
          }`;
        })
      )
    }));
  }

  return logger;
};

module.exports = createLogger();