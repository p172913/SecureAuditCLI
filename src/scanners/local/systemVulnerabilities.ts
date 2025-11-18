import chalk from 'chalk';
import { execAsync } from '../../exec.js';

export async function run() {
  console.log(chalk.blue('🔒 Scanning for system vulnerabilities...'));
  const tools = [
    { cmd: 'trivy rootfs /', tag: 'Trivy'},
    { cmd: 'lynis audit system', tag: 'Lynis'},
    { cmd: 'clamav -r /', tag: 'ClamAV'}
  ];
  for (const t of tools) {
    const res = await execAsync(t.cmd);
    console.log(chalk.yellow(`\n=== [${t.tag}] ===\n`));
    if (res.code === 0) {
      console.log(res.stdout);
    } else {
      console.error(chalk.red(res.stderr || res.stdout));
    }
  }
}
