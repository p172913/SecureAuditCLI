import chalk from 'chalk';
import { execAsync } from '../../exec.js';

export async function run(file: string) {
  if (!file) {
    throw new Error('hashIntegrityScan.run: file argument required');
  }
  console.log(chalk.blue('🔐 Checking hash/integrity for file...'));
  const tools = [
    { cmd: `sha256sum "${file}"`, tag: 'sha256sum'},
    { cmd: `cosign verify-blob --key cosign.pub "${file}"`, tag: 'cosign'}
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
