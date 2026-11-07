import type { FormatSpecificOptions, ImageFormat } from "./types.js";

export const SUPPORTED_FORMATS: ImageFormat[] = ["jpeg", "jpg", "png", "webp", "avif", "tiff", "gif"];
export type OutputFormat = "jpeg" | "png" | "webp" | "avif" | "tiff" | "gif";

export function normalizeFormat(format: string): string {
  const lower = format.toLowerCase();
  if (lower === "jpg") return "jpeg";
  if (lower === "tif") return "tiff";

  return lower;
}

export function parseFormat(format: string): OutputFormat {
  const normalized = normalizeFormat(format);

  switch (normalized) {
    case "jpeg": case "png": case "webp": case "avif": case "tiff": case "gif":
      return normalized;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

export function isFormatSupported(format: string): format is ImageFormat {
  return SUPPORTED_FORMATS.some(candidate => candidate === format);
}

const defaults: Record<OutputFormat, FormatSpecificOptions> = {
  jpeg: { quality: 80, progressive: true, chromaSubsampling: "4:4:4" },
  png: { quality: 80, compressionLevel: 6, palette: false, adaptiveFiltering: true },
  webp: { quality: 80, lossless: false, alphaQuality: 100, effort: 4, preset: "default" },
  avif: { quality: 80, lossless: false, effort: 5, chromaSubsampling: "4:4:4" },
  tiff: { quality: 80, compression: "lzw", predictor: "horizontal" },
  gif: { colours: 256, dither: 1 },
};

export function getFormatOptions(format: OutputFormat, options: FormatSpecificOptions = {}): FormatSpecificOptions {
  const defined = Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined));

  return { ...defaults[format], ...defined };
}
