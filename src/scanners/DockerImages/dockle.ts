// Dockle container image linter (CIS/Docker best practices)
// Example: dockle myimage:tag
import { exec } from 'child_process';

interface DockleOptions {
  image: string;
  options?: string;
}

export function runDockle({ image, options }: DockleOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    let cmd = `dockle ${image}`;
    if (options) cmd += ` ${options}`;
    exec(cmd, (err, stdout, stderr) => {
      if (err) return reject(stderr || err.message);
      resolve(stdout);
    });
  });
}
