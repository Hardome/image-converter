import type { AvifOptions, GifOptions, HeifOptions, JpegOptions, PngOptions, TiffOptions, WebpOptions } from "sharp";

export type ImageFormat = "jpeg" | "jpg" | "png" | "webp" | "avif" | "tiff" | "gif" | "heif" | "raw";
export type BaseConversionOptions = { quality?: number; lossless?: boolean; effort?: number; progressive?: boolean; compressionLevel?: number };
export type WebPConversionOptions = WebpOptions;
export type JPEGConversionOptions = JpegOptions;
export type PNGConversionOptions = PngOptions;
export type AVIFConversionOptions = AvifOptions;
export type TIFFConversionOptions = TiffOptions;
export type FormatSpecificOptions = WebpOptions | JpegOptions | PngOptions | AvifOptions | TiffOptions | GifOptions | HeifOptions;

export interface ConversionConfig {
  inputPath: string;
  outputPath?: string;
  outputFormat?: ImageFormat;
  options?: FormatSpecificOptions;
  overwrite?: boolean;
  deleteOriginal?: boolean;
  debug?: boolean;
}

export interface BatchConversionConfig extends Omit<ConversionConfig, "inputPath" | "outputPath"> {
  inputDir: string;
  outputDir: string;
  recursive?: boolean;
}

export interface ConversionResult {
  status: "converted" | "skipped" | "failed";
  success: boolean;
  inputPath: string;
  outputPath: string;
  inputFormat?: string;
  outputFormat?: string;
  error?: string;
  warning?: string;
  originalSize?: number;
  convertedSize?: number;
  compressionRatio?: number;
  conversionTime?: number;
}

export interface BatchConversionResults {
  converted: number;
  failed: number;
  skipped: number;
  total: number;
  results: ConversionResult[];
  totalConversionTime: number;
}

export interface FileInfo {
  width: number;
  height: number;
  size: number;
  format: string;
  hasAlpha: boolean;
  channels: number;
  space: string;
}
