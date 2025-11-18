import chalk from 'chalk';
import { execAsync } from '../../exec.js';

export async function run(image?: string) {
  if (!image) {
    throw new Error('dockerImageScan.run: image argument required');
  }
  console.log(chalk.blue('🐳 Scanning Docker image for vulnerabilities...'));
  const tools = [
    { cmd: `trivy image ${image}`, tag: 'trivy'},
    { cmd: `grype ${image}`, tag: 'grype'}
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
