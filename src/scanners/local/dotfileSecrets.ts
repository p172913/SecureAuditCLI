import chalk from 'chalk';
import { execAsync } from '../../exec.js';

export async function run() {
  console.log(chalk.blue('⚙️ Checking for secrets in dotfiles...'));
  const tools = [
    { cmd: 'gitleaks --path ~/.ssh', tag: 'Gitleaks'},
    { cmd: 'detect-secrets scan ~/.bashrc', tag: 'detect-secrets'}
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
