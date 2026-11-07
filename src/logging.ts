import type { BatchConversionResults, ConversionResult } from "./types.js";

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);

  return `${(bytes / 1024 ** index).toFixed(2)} ${units[index]}`;
}

export function logConversion(result: ConversionResult): void {
  console.log(`[DEBUG] ${result.inputPath} → ${result.outputPath}: ${result.status}`);

  if (result.error) console.error(`[DEBUG] ${result.error}`);
  if (result.warning) console.warn(`[DEBUG] ${result.warning}`);
  if (result.convertedSize !== undefined) console.log(`[DEBUG] Output: ${formatBytes(result.convertedSize)}`);
}

export function logBatch(result: BatchConversionResults): void {
  console.log(`[DEBUG] Converted: ${result.converted}; skipped: ${result.skipped}; failed: ${result.failed}; total: ${result.total}`);
}
