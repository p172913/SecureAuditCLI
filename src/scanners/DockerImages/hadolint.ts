// Hadolint Dockerfile linter
// Example: hadolint Dockerfile
import { exec } from 'child_process';

interface HadolintOptions {
  dockerfile: string;
  options?: string;
}

export function runHadolint({ dockerfile, options }: HadolintOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    let cmd = `hadolint ${dockerfile}`;
    if (options) cmd += ` ${options}`;
    exec(cmd, (err, stdout, stderr) => {
      if (err) return reject(stderr || err.message);
      resolve(stdout);
    });
  });
}
