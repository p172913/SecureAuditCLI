import chalk from 'chalk';

export function showHelp() {
  console.log(chalk.green('SecAuditHub CLI - Security Automation Toolkit'));
  console.log('\nUsage: secaudithub [command] [options]');
  console.log('\nCommands:');
  console.log('  scan <category> [scanner] [target]   Run scanner(s) in a category');
  console.log('  list                                 List available scanners');
  console.log('  report                               Show the last scan report');
  console.log('  help                                 Show CLI usage and options');
  console.log('\nShortcuts:');
  console.log('  --url <target>                       Run all web scanners against URL');
  console.log('  --url <target> --scanner <id>        Run a specific web scanner');
  console.log('\nOptions:');
  console.log('  --all      Run all scanners in a command/category');
  console.log('  --help     Show usage');
}
