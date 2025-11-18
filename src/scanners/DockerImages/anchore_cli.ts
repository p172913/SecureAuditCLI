// Anchore Engine / Anchore CLI image scanner
// Example:
// anchore-cli image add myimage:tag
// anchore-cli image vuln myimage:tag all
import { exec } from 'child_process';

interface AnchoreCliOptions {
  image: string;
  action?: 'add' | 'vuln';
  vulnType?: string; // e.g., 'all', 'os', 'non-os'
  options?: string;
}

export function runAnchoreCli({ image, action = 'vuln', vulnType = 'all', options }: AnchoreCliOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    let cmd = '';
    if (action === 'add') {
      cmd = `anchore-cli image add ${image}`;
    } else {
      cmd = `anchore-cli image vuln ${image} ${vulnType}`;
    }
    if (options) cmd += ` ${options}`;
    exec(cmd, (err, stdout, stderr) => {
      if (err) return reject(stderr || err.message);
      resolve(stdout);
    });
  });
}
