import chalk from 'chalk';
import { listWebScannerLabels } from '../scanners/WebScanners/index.js';

// Keep this in sync with available scanner categories
const SCANNER_CATEGORIES: Record<string, string[]> = {
  repo: ['Gitleaks', 'TruffleHog', 'detect-secrets'],
  images: ['scanMalware', 'scanIntegrity', 'scanMetadata', 'scanNSFW', 'scanStego'],
  web: listWebScannerLabels(),
  // add more categories if you expand
};

export function listScanners() {
  console.log(chalk.cyan('Available scanner categories & scanners:'));
  for (const [cat, scanners] of Object.entries(SCANNER_CATEGORIES)) {
    console.log(`\n${cat.toUpperCase()}:`);
    if (scanners.length === 0) {
      console.log('  (none configured)');
      continue;
    }
    for (const s of scanners) {
      console.log(`  - ${s}`);
    }
  }
}
