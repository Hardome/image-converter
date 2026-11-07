import { access, link, mkdir, readdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { isFormatSupported, normalizeFormat } from "./formats.js";

export async function fileExists(filename: string): Promise<boolean> {
  try {
    await access(filename);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

export function isWithin(directory: string, filename: string): boolean {
  const relative = path.relative(path.resolve(directory), path.resolve(filename));

  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

export async function findImageFiles(directory: string, recursive: boolean, outputDirectory: string): Promise<string[]> {
  const files: string[] = [];

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);

    if (isWithin(outputDirectory, filename)) continue;
    if (entry.isDirectory() && recursive) files.push(...await findImageFiles(filename, recursive, outputDirectory));
    else if (entry.isFile() && isFormatSupported(normalizeFormat(path.extname(filename).slice(1)))) files.push(filename);
  }

  return files;
}

export function allocateOutputPath(input: string, inputDirectory: string, outputDirectory: string, format: string, allocated: Set<string>): string {
  const relative = path.relative(inputDirectory, input);

  const base = path.join(outputDirectory, path.dirname(relative), path.basename(relative, path.extname(relative)));
  let output = `${base}.${format}`;
  let suffix = 2;

  while (allocated.has(output.toLowerCase())) output = `${base}-${suffix++}.${format}`;

  allocated.add(output.toLowerCase());

  return output;
}

export async function writeOutput(output: string, overwrite: boolean, write: (temporary: string) => Promise<unknown>): Promise<void> {
  await mkdir(path.dirname(output), { recursive: true });
  const temporary = `${output}.${randomUUID()}.tmp`;

  try {
    await write(temporary);
    // Linking is exclusive: a file created after the initial check is never replaced.
    if (overwrite) await rename(temporary, output);
    else await link(temporary, output);
  } finally {
    await rm(temporary, { force: true });
  }
}
