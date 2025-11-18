import { exec } from 'child_process';
import * as path from 'path';

/**
 * Scan a git repository using Gitleaks CLI.
 * @param repoPath Path to the git repository.
 * @param opts Optional: outputFormat, etc.
 */
export function scanWithGitleaks(repoPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = `gitleaks detect -s ${JSON.stringify(repoPath)}`;
    exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        if (stderr.includes('not recognized') || stderr.includes('not found')) {
          console.error('[ERROR] Gitleaks is not installed. Please install it from https://github.com/gitleaks/gitleaks#installation');
        } else {
          console.error('[Gitleaks ERROR]', stderr.trim() || error.message);
        }
        reject(error);
        return;
      }
      console.log('[Gitleaks Scan Result]');
      console.log(stdout);
      resolve();
    });
  });
}

// CLI usage
if (require.main === module) {
  const repoArg = process.argv[2];
  if (!repoArg) {
    console.error('Usage: ts-node Gitleaks.ts /path/to/repo');
    process.exit(1);
  }
  scanWithGitleaks(path.resolve(repoArg))
    .catch(() => process.exit(2));
}

// Install hint: Gitleaks CLI must be installed and on PATH.
// Example: https://github.com/gitleaks/gitleaks#installation
