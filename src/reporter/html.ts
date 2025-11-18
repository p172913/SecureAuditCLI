import ejs from 'ejs';
import fs from 'fs';
import path from 'path';

const TEMPLATE_DIR = path.resolve(__dirname, './templates');

export async function renderHtmlReport(data: any): Promise<string> {
  const mainTpl = fs.readFileSync(path.join(TEMPLATE_DIR, 'report.ejs'), 'utf-8');
  // Optionally: const summaryTpl = fs.readFileSync(path.join(TEMPLATE_DIR, 'summary.ejs'), 'utf-8');
  // Pass summaryTpl as partial if used in mainTpl
  return ejs.render(mainTpl, { data }, { async: true, root: TEMPLATE_DIR });
}
