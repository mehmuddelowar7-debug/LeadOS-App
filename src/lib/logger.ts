/**
 * LeadOS Structured Logging Utility
 * Provides a standardized way to log events, errors, and metrics across the application.
 * Ensures PII (Personally Identifiable Information) is scrubbed before being sent to external monitoring.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogContext {
  [key: string]: any
}

class Logger {
  private isProduction = import.meta.env.PROD

  private scrubContext(context?: LogContext): LogContext | undefined {
    if (!context) return undefined
    const scrubbed = { ...context }
    // Scrub PII
    if (scrubbed.phone) scrubbed.phone = '[REDACTED]'
    if (scrubbed.whatsapp) scrubbed.whatsapp = '[REDACTED]'
    if (scrubbed.email) scrubbed.email = '[REDACTED]'
    if (scrubbed.password) scrubbed.password = '[REDACTED]'
    if (scrubbed.token) scrubbed.token = '[REDACTED]'
    return scrubbed
  }

  private emit(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString()
    const safeContext = this.scrubContext(context)

    const payload = {
      timestamp,
      level,
      message,
      context: safeContext,
    }

    if (!this.isProduction) {
      // In development, log to console with formatting
      switch (level) {
        case 'info': console.info(`[INFO] ${message}`, safeContext || ''); break;
        case 'warn': console.warn(`[WARN] ${message}`, safeContext || ''); break;
        case 'error': console.error(`[ERROR] ${message}`, safeContext || ''); break;
        case 'debug': console.debug(`[DEBUG] ${message}`, safeContext || ''); break;
      }
    } else {
      // In production, send to monitoring service (e.g., Sentry, Datadog)
      // This is the integration point for Enterprise APM
      if (level === 'error') {
        // Example: Sentry.captureMessage(message, { level: 'error', extra: safeContext })
        console.error(JSON.stringify(payload))
      } else {
        // Standard structural logging for CloudWatch / Datadog
        console.log(JSON.stringify(payload))
      }
    }
  }

  info(message: string, context?: LogContext) { this.emit('info', message, context) }
  warn(message: string, context?: LogContext) { this.emit('warn', message, context) }
  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext = error instanceof Error 
      ? { errorMessage: error.message, stack: error.stack, ...context }
      : { rawError: error, ...context }
    this.emit('error', message, errorContext)
  }
  debug(message: string, context?: LogContext) { this.emit('debug', message, context) }
}

export const logger = new Logger()
