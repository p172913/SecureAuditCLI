#!/usr/bin/env node
import { showHelp } from './help.js';
import { listScanners } from './list.js';
import { showReport } from './report.js';
import { runAllWebScanners, runWebScannerById, getWebScannerIds } from '../scanners/WebScanners/index.js';

const args = process.argv.slice(2);
const command = args[0];
const SCAN_FORWARD_COMMANDS = new Set(['code', 'repo', 'images', 'local', 'cloud']);

function extractOptionValue(longFlag: string, shortFlag?: string): string | undefined {
  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    if (token === undefined) {
      continue;
    }
    if (token === longFlag || (shortFlag && token === shortFlag)) {
      return args[i + 1];
    }
    if (token.startsWith(`${longFlag}=`)) {
      return token.split('=')[1];
    }
    if (shortFlag && token.startsWith(`${shortFlag}=`)) {
      return token.split('=')[1];
    }
  }
  return undefined;
}

async function handleWebShortcut(): Promise<boolean> {
  const url = extractOptionValue('--url', '-u');
  if (!url) {
    return false;
  }
  const scanner = extractOptionValue('--scanner', '-s');
  try {
    if (scanner) {
      await runWebScannerById(scanner, url);
    } else {
      await runAllWebScanners(url);
    }
  } catch (err) {
    console.error('Web scanning failed:', err);
    process.exit(2);
  }
  return true;
}

async function main() {
  if (await handleWebShortcut()) {
    return;
  }

  if (!command || command === 'scan') {
    await import('./scan.js');
    return;
  }

  if (SCAN_FORWARD_COMMANDS.has(command)) {
    await import('./scan.js');
    return;
  }

  switch (command) {
    case 'help':
      showHelp();
      break;
    case 'list':
      listScanners();
      break;
    case 'report':
      showReport();
      break;
    default:
      console.error('Unknown command:', command);
      console.log('\nUsage examples:');
      console.log('  secaudithub scan web --all https://example.com');
      console.log('  secaudithub --url https://example.com');
      console.log('  secaudithub help');
      process.exit(1);
  }
}

main().catch((err) => {
  console.error('CLI execution failed:', err);
  process.exit(1);
});
