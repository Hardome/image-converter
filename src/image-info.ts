import sharp from "sharp";
import { stat } from "node:fs/promises";
import type { FileInfo } from "./types.js";

export async function getFileInfo(filename: string): Promise<FileInfo | null> {
  try {
    const metadata = await sharp(filename).metadata();
    const stats = await stat(filename);

    return {
      width: metadata.width ?? 0, height: metadata.height ?? 0, size: stats.size,
      format: metadata.format ?? "unknown", hasAlpha: metadata.hasAlpha ?? false,
      channels: metadata.channels ?? 0, space: metadata.space ?? "unknown",
    };
  } catch {
    return null;
  }
}
