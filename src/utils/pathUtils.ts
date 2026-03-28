import * as path from 'path';

export function normalizePath(inputPath: string): string {
  return path.normalize(inputPath).replace(/\\/g, '/');
}