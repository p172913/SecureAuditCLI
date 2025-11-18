import fs from 'fs';

export async function run(target: string) {
  fs.writeFileSync('mock-output.txt', `Scanned: ${target}`);
  return true;
}
