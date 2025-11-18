import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Scan a repo for secrets using detect-secrets CLI.
 * @param repoPath Path to the git repository
 */
export function scanWithDetectSecrets(repoPath: string): Promise<void> {
  const absRepo = path.resolve(repoPath);
  const baselineFile = path.join(absRepo, '.secrets.baseline');

  return new Promise((resolve, reject) => {
    // Step 1: Run detect-secrets scan > .secrets.baseline
    exec(`detect-secrets scan > .secrets.baseline`, { cwd: absRepo }, (scanErr, scanOut, scanErrOut) => {
      if (scanErr) {
        if ((scanErrOut || '').includes('not recognized') || (scanErrOut || '').includes('not found')) {
          console.error('[ERROR] detect-secrets CLI not installed. See https://github.com/Yelp/detect-secrets for instructions.');
        } else {
          console.error('[Detect-Secrets SCAN ERROR]', scanErrOut.trim() || scanErr.message);
        }
        reject(scanErr);
        return;
      }
      console.log('[detect-secrets] Baseline created. Auditing...');
      // Step 2: Run detect-secrets audit .secrets.baseline
      exec(`detect-secrets audit .secrets.baseline`, { cwd: absRepo }, (auditErr, auditOut, auditErrOut) => {
        if (auditErr) {
          console.error('[Detect-Secrets AUDIT ERROR]', auditErrOut.trim() || auditErr.message);
          reject(auditErr);
          return;
        }
        console.log('[Detect-Secrets Audit Result]');
        console.log(auditOut);
        // Cleanup: Optionally remove the .secrets.baseline file
        if (fs.existsSync(baselineFile)) fs.rmSync(baselineFile);
        resolve();
      });
    });
  });
}

// CLI usage
if (require.main === module) {
  const repoArg = process.argv[2];
  if (!repoArg) {
    console.error('Usage: ts-node detect-secrets.ts /path/to/repo');
    process.exit(1);
  }
  scanWithDetectSecrets(repoArg)
    .catch(() => process.exit(2));
}

// Install hint: detect-secrets must be installed and on PATH. See https://github.com/Yelp/detect-secrets
