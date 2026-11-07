import { afterEach, expect, test, vi } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { convertFile } from "../src/convert-file.js";

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();

  return {
    ...actual,
    unlink: vi.fn(async () => {
      throw new Error("Permission denied");
    }),
  };
});

let directory: string | undefined;

afterEach(async () => {
  if (directory) {
    await rm(directory, { recursive: true, force: true, maxRetries: 5 });
  }
});

test("failure to remove the original does not hide a successful conversion", async () => {
  sharp.cache(false);
  directory = await mkdtemp(path.join(os.tmpdir(), "converter-delete-"));

  const inputPath = path.join(directory, "source.png");
  const outputPath = path.join(directory, "result.webp");

  await sharp({
    create: { width: 2, height: 2, channels: 3, background: "red" },
  }).png().toFile(inputPath);

  const original = await readFile(inputPath);
  const result = await convertFile({ inputPath, outputPath, deleteOriginal: true });

  expect(result.status).toBe("converted");
  expect(result.success).toBe(true);
  expect(result.warning).toContain("Permission denied");
  expect(await readFile(inputPath)).toEqual(original);
  expect((await sharp(outputPath).metadata()).format).toBe("webp");
});
