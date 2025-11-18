import chalk from 'chalk';
import { execAsync } from '../../exec.js';

export async function run() {
  console.log(chalk.blue('⚡ Checking system performance...'));
  const tools = [
    { cmd: 'top -b -n1', tag: 'top'},
    { cmd: 'vmstat', tag: 'vmstat'},
    { cmd: 'iotop -b -n1', tag: 'iotop'}
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
