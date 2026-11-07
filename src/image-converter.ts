import { convertFile } from "./convert-file.js";
import { convertBatch } from "./convert-batch.js";
import { getFileInfo } from "./image-info.js";
import { isFormatSupported, SUPPORTED_FORMATS } from "./formats.js";
import type { BatchConversionConfig, ConversionConfig } from "./types.js";

export class ImageConverter {
  convertSingleFile(config: ConversionConfig) { return convertFile(config); }
  convertBatch(config: BatchConversionConfig) { return convertBatch(config); }
  async convertMultiple(files: ConversionConfig[]) {
    const results = [];
    for (const config of files) results.push(await convertFile(config));
    return results;
  }
  getFileInfo(filename: string) { return getFileInfo(filename); }
  isFormatSupported = isFormatSupported;
  getSupportedFormats(): string[] { return [...SUPPORTED_FORMATS]; }
}
