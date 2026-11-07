import { afterEach, beforeEach, expect, test } from "vitest";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { writeOutput } from "../src/files.js";

let directory: string;
beforeEach(async () => { directory = await mkdtemp(path.join(os.tmpdir(), "converter-files-")); });
afterEach(async () => { await rm(directory, { recursive: true, force: true, maxRetries: 5 }); });

test("a file appearing during conversion is not overwritten", async () => {
  const output = path.join(directory, "result.webp");
  await expect(writeOutput(output, false, async temporary => {
    await writeFile(temporary, "converted");
    await writeFile(output, "created by another process");
  })).rejects.toMatchObject({ code: "EEXIST" });

  expect(await readFile(output, "utf8")).toBe("created by another process");
  expect(await readdir(directory)).toEqual(["result.webp"]);
});

test("temporary files are removed after the writer fails", async () => {
  await expect(writeOutput(path.join(directory, "result.webp"), false, async temporary => {
    await writeFile(temporary, "partial");
    throw new Error("encoder failed");
  })).rejects.toThrow("encoder failed");
  expect(await readdir(directory)).toEqual([]);
});
