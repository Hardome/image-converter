import path from "node:path";
import { stat } from "node:fs/promises";
import { allocateOutputPath, findImageFiles } from "./files.js";
import { parseFormat } from "./formats.js";
import { convertFile } from "./convert-file.js";
import { logBatch } from "./logging.js";
import type { BatchConversionConfig, BatchConversionResults } from "./types.js";

export async function convertBatch(config: BatchConversionConfig): Promise<BatchConversionResults> {
  const started = Date.now();
  const result: BatchConversionResults = { converted: 0, failed: 0, skipped: 0, total: 0, results: [], totalConversionTime: 0 };

  try {
    if (path.resolve(config.inputDir) === path.resolve(config.outputDir)) throw new Error("Input and output directories must differ");
    if (!(await stat(config.inputDir)).isDirectory()) throw new Error("Input must be a directory");

    const format = parseFormat(config.outputFormat ?? "webp");
    const files = await findImageFiles(config.inputDir, config.recursive ?? true, config.outputDir);

    result.total = files.length;

    const allocated = new Set<string>();

    for (const inputPath of files) {
      const outputPath = allocateOutputPath(inputPath, config.inputDir, config.outputDir, format, allocated);
      const converted = await convertFile({ ...config, inputPath, outputPath, outputFormat: format });

      result.results.push(converted);
      result[converted.status]++;
    }
  } catch (error) {
    result.failed++;
    result.results.push({ status: "failed", success: false, inputPath: config.inputDir, outputPath: config.outputDir, error: error instanceof Error ? error.message : String(error) });
  } finally {
    result.totalConversionTime = Date.now() - started;

    if (config.debug) logBatch(result);
  }
  return result;
}
