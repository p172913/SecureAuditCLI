import { exec } from 'child_process';

export interface ExecResult {
  stdout: string;
  stderr: string;
  code: number;
}

export async function execAsync(command: string, opts?: { cwd?: string }): Promise<ExecResult> {
  return new Promise((resolve) => {
    exec(command, { ...opts, maxBuffer: 20 * 1024 * 1024 }, (error, stdout, stderr) => {
      resolve({
        stdout,
        stderr,
        code: error?.code ?? (stderr ? 1 : 0),
      });
    });
  });
}
