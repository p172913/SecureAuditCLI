import { exec } from 'child_process';
import * as path from 'path';

/**
 * Scan a git repository using TruffleHog CLI.
 * @param repo Git repo URL or local path.
 */
export function scanWithTruffleHog(repo: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = `trufflehog git ${JSON.stringify(repo)}`;
    exec(command, { maxBuffer: 20 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        if (stderr.includes('not recognized') || stderr.includes('not found')) {
          console.error('[ERROR] TruffleHog is not installed. Please install it from https://github.com/trufflesecurity/trufflehog#installation');
        } else {
          console.error('[TruffleHog ERROR]', stderr.trim() || error.message);
        }
        reject(error);
        return;
      }
      console.log('[TruffleHog Scan Result]');
      console.log(stdout);
      resolve();
    });
  });
}

// CLI usage
if (require.main === module) {
  const repoArg = process.argv[2];
  if (!repoArg) {
    console.error('Usage: ts-node TruffleHog.ts /path/to/repo-or-url');
    process.exit(1);
  }
  scanWithTruffleHog(path.resolve(repoArg))
    .catch(() => process.exit(2));
}

// Install hint: TruffleHog CLI must be installed and on PATH. See official instructions.
