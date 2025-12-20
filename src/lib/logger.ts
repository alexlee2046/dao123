/**
 * Server-side logging utility
 * Logs are written to a file for easy debugging
 */

import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'server-debug.log');
const MAX_LOG_SIZE = 1024 * 1024; // 1MB max

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    module: string;
    message: string;
    data?: any;
}

function formatLogEntry(entry: LogEntry): string {
    const dataStr = entry.data ? `\n  Data: ${JSON.stringify(entry.data, null, 2).replace(/\n/g, '\n  ')}` : '';
    return `[${entry.timestamp}] [${entry.level}] [${entry.module}] ${entry.message}${dataStr}\n`;
}

function ensureLogFile() {
    try {
        // Check if file exists and its size
        if (fs.existsSync(LOG_FILE)) {
            const stats = fs.statSync(LOG_FILE);
            if (stats.size > MAX_LOG_SIZE) {
                // Rotate log: keep last half
                const content = fs.readFileSync(LOG_FILE, 'utf-8');
                const lines = content.split('\n');
                const halfLines = lines.slice(Math.floor(lines.length / 2));
                fs.writeFileSync(LOG_FILE, '--- Log rotated ---\n' + halfLines.join('\n'));
            }
        }
    } catch (e) {
        // Ignore file system errors
    }
}

function writeLog(entry: LogEntry) {
    try {
        ensureLogFile();
        const formatted = formatLogEntry(entry);
        fs.appendFileSync(LOG_FILE, formatted);

        // Also log to console in development
        if (process.env.NODE_ENV !== 'production') {
            const color = {
                DEBUG: '\x1b[36m', // Cyan
                INFO: '\x1b[32m',  // Green
                WARN: '\x1b[33m',  // Yellow
                ERROR: '\x1b[31m', // Red
            }[entry.level] || '\x1b[0m';
            const reset = '\x1b[0m';
            console.log(`${color}[${entry.level}]${reset} [${entry.module}] ${entry.message}`);
            if (entry.data) {
                console.log('  Data:', entry.data);
            }
        }
    } catch (e) {
        // Fallback to console only
        console.log(`[${entry.level}] [${entry.module}] ${entry.message}`, entry.data || '');
    }
}

export function createLogger(module: string) {
    const now = () => new Date().toISOString();

    return {
        debug: (message: string, data?: any) => {
            writeLog({ timestamp: now(), level: 'DEBUG', module, message, data });
        },
        info: (message: string, data?: any) => {
            writeLog({ timestamp: now(), level: 'INFO', module, message, data });
        },
        warn: (message: string, data?: any) => {
            writeLog({ timestamp: now(), level: 'WARN', module, message, data });
        },
        error: (message: string, data?: any) => {
            writeLog({ timestamp: now(), level: 'ERROR', module, message, data });
        },
    };
}

// Clear log file (call at server start or manually)
export function clearLog() {
    try {
        fs.writeFileSync(LOG_FILE, `--- Log started at ${new Date().toISOString()} ---\n`);
    } catch (e) {
        console.error('Failed to clear log file:', e);
    }
}

// Read recent logs
export function readRecentLogs(lines: number = 100): string {
    try {
        if (!fs.existsSync(LOG_FILE)) {
            return 'No logs yet.';
        }
        const content = fs.readFileSync(LOG_FILE, 'utf-8');
        const allLines = content.split('\n');
        return allLines.slice(-lines).join('\n');
    } catch (e) {
        return `Error reading logs: ${e}`;
    }
}

// Export a default logger for quick usage
export const serverLog = createLogger('Server');

// ============================================
// Domain-specific loggers
// ============================================

/**
 * Automation-specific logger
 */
export const automationLogger = {
  triggerReceived: (automationId: string, contactId: string, triggerType: string) => {
    const log = createLogger('Automation');
    log.info('Trigger received', { automationId, contactId, triggerType });
  },

  stepStarted: (automationId: string, enrollmentId: string, stepIndex: number, stepType: string) => {
    const log = createLogger('Automation');
    log.info('Step started', { automationId, enrollmentId, stepIndex, stepType });
  },

  stepCompleted: (automationId: string, enrollmentId: string, stepIndex: number, duration: number) => {
    const log = createLogger('Automation');
    log.info('Step completed', { automationId, enrollmentId, stepIndex, duration });
  },

  stepFailed: (automationId: string, enrollmentId: string, stepIndex: number, error: string) => {
    const log = createLogger('Automation');
    log.error('Step failed', { automationId, enrollmentId, stepIndex, error });
  },

  enrollmentCompleted: (automationId: string, enrollmentId: string, totalSteps: number) => {
    const log = createLogger('Automation');
    log.info('Enrollment completed', { automationId, enrollmentId, totalSteps });
  },

  enrollmentError: (automationId: string, enrollmentId: string, error: string) => {
    const log = createLogger('Automation');
    log.error('Enrollment error', { automationId, enrollmentId, error });
  },
};

/**
 * Workflow-specific logger
 */
export const workflowLogger = {
  runStarted: (workflowId: string, runId: string, userId: string) => {
    const log = createLogger('Workflow');
    log.info('Run started', { workflowId, runId, userId });
  },

  nodeExecuting: (workflowId: string, runId: string, nodeId: string, nodeType: string) => {
    const log = createLogger('Workflow');
    log.debug('Node executing', { workflowId, runId, nodeId, nodeType });
  },

  nodeCompleted: (workflowId: string, runId: string, nodeId: string, duration: number) => {
    const log = createLogger('Workflow');
    log.info('Node completed', { workflowId, runId, nodeId, duration });
  },

  nodeFailed: (workflowId: string, runId: string, nodeId: string, error: string) => {
    const log = createLogger('Workflow');
    log.error('Node failed', { workflowId, runId, nodeId, error });
  },

  runCompleted: (workflowId: string, runId: string, totalDuration: number, nodesExecuted: number) => {
    const log = createLogger('Workflow');
    log.info('Run completed', { workflowId, runId, duration: totalDuration, nodesExecuted });
  },

  runFailed: (workflowId: string, runId: string, error: string) => {
    const log = createLogger('Workflow');
    log.error('Run failed', { workflowId, runId, error });
  },
};

/**
 * Page tracking logger
 */
export const trackingLogger = {
  pageVisitRecorded: (contactId: string, pageUrl: string, userId: string) => {
    const log = createLogger('Tracking');
    log.debug('Page visit recorded', { contactId, userId, pageUrl });
  },

  pageVisitError: (contactId: string, pageUrl: string, error: string) => {
    const log = createLogger('Tracking');
    log.error('Page visit tracking error', { contactId, pageUrl, error });
  },
};
