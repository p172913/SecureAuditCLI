// Centralized config for SecAuditHub CLI
// Extend this module as your app grows (add .env support, config file reads, etc.)

export interface CliConfig {
  // Example: working directory for scans
  scanRootDir: string;
  // Example: log level
  logLevel: 'info' | 'warn' | 'error' | 'debug';
  // Placeholder for future config: API, tokens, etc.
  // apiKey?: string;
  wordlistPath?: string | undefined;
  zapOutputPath?: string | undefined;
}

// Default values (environment-variable overrides supported)
const config: CliConfig = {
  scanRootDir: process.env.SEC_AUDIT_SCAN_ROOT || process.cwd(),
  logLevel: (process.env.SEC_AUDIT_LOG_LEVEL as 'info' | 'warn' | 'error' | 'debug') || 'info',
  wordlistPath: process.env.SEC_AUDIT_WORDLIST || undefined,
  zapOutputPath: process.env.SEC_AUDIT_ZAP_OUTPUT || undefined,
};

// Expose a reload/validate for future expansion if desired
function reloadConfig(): CliConfig {
  // Update config object if supporting config hot-reloads or .env reads in future
  return {
    scanRootDir: process.env.SEC_AUDIT_SCAN_ROOT || process.cwd(),
    logLevel: (process.env.SEC_AUDIT_LOG_LEVEL as 'info' | 'warn' | 'error' | 'debug') || 'info',
    wordlistPath: process.env.SEC_AUDIT_WORDLIST || undefined,
    zapOutputPath: process.env.SEC_AUDIT_ZAP_OUTPUT || undefined,
  };
}

export { config, reloadConfig };
