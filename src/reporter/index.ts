import { renderHtmlReport } from './html.js';
import { renderPdfReport } from './pdf.js';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

// Main generator: outputs HTML or PDF report from secaudit-report.json
export async function generateReport({ format = 'html', outFile }: { format: 'html' | 'pdf', outFile?: string } = { format: 'html' }) {
  const jsonReportPath = path.resolve(process.cwd(), 'secaudit-report.json');
  if (!existsSync(jsonReportPath)) {
    throw new Error('No report file found. Run a scan first!');
  }
  const jsonData = JSON.parse(readFileSync(jsonReportPath, 'utf-8'));

  let out;
  if (format === 'pdf') {
    const pdfBuffer = await renderPdfReport(jsonData);
    out = outFile || 'secaudit-report.pdf';
    writeFileSync(out, pdfBuffer);
    console.log(`PDF report generated: ${out}`);
  } else {
    const html = await renderHtmlReport(jsonData);
    out = outFile || 'secaudit-report.html';
    writeFileSync(out, html);
    console.log(`HTML report generated: ${out}`);
  }
}
