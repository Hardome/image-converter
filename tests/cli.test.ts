import { expect, test } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";

const run = promisify(execFile);
const cwd = fileURLToPath(new URL("..", import.meta.url));

test("the CLI prints help", async () => {
  const { stdout } = await run(process.execPath, ["--import", "tsx", "src/cli.ts", "--help"], { cwd });
  expect(stdout).toContain("--format");
});

test("invalid CLI quality returns a nonzero exit code", async () => {
  await expect(run(process.execPath, ["--import", "tsx", "src/cli.ts", "--quality", "101"], { cwd }))
    .rejects.toMatchObject({ code: 1 });
});

test("conversion prints readable sizes, savings and elapsed time instead of JSON", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "converter-cli-"));

  try {
    const input = path.join(directory, "input");
    const output = path.join(directory, "output");

    await mkdir(input);
    sharp.cache(false);

    await sharp({
      create: { width: 10, height: 10, channels: 3, background: "red" },
    }).png().toFile(path.join(input, "photo.png"));

    const { stdout } = await run(process.execPath, [
      "--import", "tsx", "src/cli.ts", "--input", input, "--output", output,
    ], { cwd });

    expect(stdout).toContain("Готово: photo.png → photo.webp");
    expect(stdout).toContain("обработано 1, пропущено 0, ошибок 0");
    expect(stdout).toContain("Размер обработанных файлов:");
    expect(stdout).toMatch(/экономия:|увеличение:|размер не изменился/u);
    expect(stdout).toContain("Затрачено времени:");
    expect(stdout).not.toContain('"results"');
  } finally {
    await rm(directory, { recursive: true, force: true, maxRetries: 5 });
  }
});
