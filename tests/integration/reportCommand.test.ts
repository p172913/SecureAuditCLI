import { execa } from 'execa';
import fs from 'fs';
import path from 'path';

describe('SecAuditHub CLI report command', () => {
  const CLI_PATH = path.resolve(__dirname, '../../src/cli/index.ts');
  const REPORT_FILE = path.resolve(process.cwd(), 'secaudit-report.json');
  const reportData = {
    date: '2023-01-01',
    summary: { total: 2, high: 1, low: 1 },
    issues: [
      { id: 'A1', type: 'leak', description: 'Secret found', severity: 'high' },
      { id: 'A2', type: 'outdated', description: 'Old dependency', severity: 'low' }
    ]
  };

  beforeEach(() => {
    fs.writeFileSync(REPORT_FILE, JSON.stringify(reportData));
  });

  afterEach(() => {
    if (fs.existsSync(REPORT_FILE)) fs.rmSync(REPORT_FILE);
  });

  it('shows formatted report if report file exists', async () => {
    const { stdout } = await execa('node', [CLI_PATH, 'report']);
    expect(stdout).toMatch(/Last Scan Report/);
    expect(stdout).toMatch(/A1/);
    expect(stdout).toMatch(/Secret found/);
  });

  it('shows not found message if no report file', async () => {
    fs.rmSync(REPORT_FILE);
    const { stdout } = await execa('node', [CLI_PATH, 'report']);
    expect(stdout).toMatch(/No past scan report found/);
  });
});
