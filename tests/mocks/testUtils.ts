import fs from 'fs';

export function cleanFile(file: string) {
  if (fs.existsSync(file)) fs.rmSync(file);
}

export function writeSampleReport(path: string, data: any) {
  fs.writeFileSync(path, JSON.stringify(data));
}
