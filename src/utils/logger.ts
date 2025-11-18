import chalk from 'chalk';

let level: 'info' | 'warn' | 'error' | 'debug' = (process.env.SEC_AUDIT_LOG_LEVEL as any) || 'info';

function shouldLog(l: string): boolean {
  const order = ['error', 'warn', 'info', 'debug'];
  return order.indexOf(l) <= order.indexOf(level);
}

export function setLogLevel(newLevel: 'info' | 'warn' | 'error' | 'debug') {
  level = newLevel;
}

export function info(...args: any[]) {
  if (shouldLog('info')) console.log(chalk.cyan('[INFO]'), ...args);
}
export function warn(...args: any[]) {
  if (shouldLog('warn')) console.warn(chalk.yellow('[WARN]'), ...args);
}
export function error(...args: any[]) {
  if (shouldLog('error')) console.error(chalk.red('[ERROR]'), ...args);
}
export function debug(...args: any[]) {
  if (shouldLog('debug')) console.debug(chalk.gray('[DEBUG]'), ...args);
}
