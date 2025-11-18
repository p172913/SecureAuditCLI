import { promises as fs } from 'fs';
import path from 'path';

export async function readJson(filePath: string): Promise<any> {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

export async function writeJson(filePath: string, data: any): Promise<void> {
  const jsonStr = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, jsonStr, 'utf-8');
}

export async function readText(filePath: string): Promise<string> {
  return await fs.readFile(filePath, 'utf-8');
}

export async function writeText(filePath: string, content: string): Promise<void> {
  await fs.writeFile(filePath, content, 'utf-8');
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}
