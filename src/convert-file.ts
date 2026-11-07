import sharp from "sharp";
import path from "node:path";
import { stat, unlink } from "node:fs/promises";
import { fileExists, writeOutput } from "./files.js";
import { getFormatOptions, parseFormat } from "./formats.js";
import { logConversion } from "./logging.js";
import type { ConversionConfig, ConversionResult } from "./types.js";

export async function convertFile(config: ConversionConfig): Promise<ConversionResult> {
  const started = Date.now();
  const outputPath = config.outputPath ?? path.join(path.dirname(config.inputPath), `${path.basename(config.inputPath, path.extname(config.inputPath))}.${config.outputFormat ?? "webp"}`);
  const result: ConversionResult = { status: "failed", success: false, inputPath: config.inputPath, outputPath };

  try {
    if (path.resolve(config.inputPath) === path.resolve(outputPath)) throw new Error("Input and output must differ");

    const format = parseFormat(config.outputFormat ?? path.extname(outputPath).slice(1));

    result.outputFormat = format;

    const original = await stat(config.inputPath);

    if (!config.overwrite && await fileExists(outputPath)) {
      result.status = "skipped";
      result.error = "Output file already exists";
      return result;
    }

    const metadata = await sharp(config.inputPath).metadata();

    result.inputFormat = metadata.format;

    await writeOutput(outputPath, config.overwrite ?? false, temporary =>
      sharp(config.inputPath).toFormat(format, getFormatOptions(format, config.options)).toFile(temporary),
    );

    result.status = "converted";
    result.success = true;
    result.originalSize = original.size;
    result.convertedSize = (await stat(outputPath)).size;
    result.compressionRatio = original.size > 0 ? result.convertedSize / original.size : 0;

    if (config.deleteOriginal) {
      try {
        await unlink(config.inputPath);
      } catch (error) {
        result.warning = `Converted successfully, but original could not be removed: ${error instanceof Error ? error.message : String(error)}`;
      }
    }
  } catch (error) {
    result.status = (error as NodeJS.ErrnoException).code === "EEXIST" ? "skipped" : "failed";
    result.error = error instanceof Error ? error.message : String(error);
  } finally {
    result.conversionTime = Date.now() - started;

    if (config.debug) logConversion(result);
  }
  return result;
}
