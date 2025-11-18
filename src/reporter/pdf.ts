import puppeteer from 'puppeteer';
import { renderHtmlReport } from './html.js';

export async function renderPdfReport(data: any): Promise<Buffer> {
  const html = await renderHtmlReport(data);
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();
  return Buffer.from(pdf);
}
