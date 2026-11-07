import { afterEach, beforeEach, expect, test } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { ImageConverter } from "../converter.js";

let directory: string;
const converter = new ImageConverter();

beforeEach(async () => {
  sharp.cache(false);
  directory = await fs.mkdtemp(path.join(os.tmpdir(), "image-converter-"));
});

afterEach(async () => {
  await fs.rm(directory, { recursive: true, force: true, maxRetries: 5 });
});

test("missing input produces a failed batch", async () => {
  const result = await converter.convertBatch({
    inputDir: path.join(directory, "missing"),
    outputDir: path.join(directory, "output"),
  });

  expect(result.failed).toBeGreaterThan(0);
});

test("failed conversion preserves the original even with deleteOriginal", async () => {
  const inputPath = path.join(directory, "broken.png");
  await fs.writeFile(inputPath, "invalid image");

  const result = await converter.convertSingleFile({
    inputPath,
    outputPath: path.join(directory, "broken.webp"),
    deleteOriginal: true,
  });

  expect(result.success).toBe(false);
  expect(await fs.readFile(inputPath, "utf8")).toBe("invalid image");
});

test("single-file conversion creates nested output directories", async () => {
  const inputPath = path.join(directory, "source.png");
  const outputPath = path.join(directory, "nested", "photo.webp");
  await sharp({
    create: { width: 2, height: 2, channels: 3, background: "red" },
  })
    .png()
    .toFile(inputPath);

  const result = await converter.convertSingleFile({ inputPath, outputPath });

  expect(result.success).toBe(true);
  expect((await sharp(outputPath).metadata()).format).toBe("webp");
});
