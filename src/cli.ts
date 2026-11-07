import { parseArgs } from "node:util";
import { ImageConverter } from "./image-converter.js";
import { parseFormat } from "./formats.js";

export async function main() {
  const { values } = parseArgs({
    options: {
      input: { type: "string", default: "./input" },
      output: { type: "string", default: "./output" },
      format: { type: "string", default: "webp" },
      quality: { type: "string" },
      overwrite: { type: "boolean", default: false },
      recursive: { type: "boolean", default: true },
      help: { type: "boolean" },
    },
  });

  if (values.help) {
    console.log(
      "npm run convert -- --input ./input --output ./output --format webp [--quality 80] [--overwrite]",
    );
    return;
  }

  const quality =
    values.quality === undefined ? undefined : Number(values.quality);

  if (
    quality !== undefined &&
    (!Number.isInteger(quality) || quality < 1 || quality > 100)
  )
    throw new Error("Качество должно быть целым числом от 1 до 100");

  const format = parseFormat(values.format ?? "webp");

  console.log(`Конвертация изображений в ${format.toUpperCase()}`);
  console.log(`Исходная папка: ${values.input}`);
  console.log(`Папка результата: ${values.output}`);
  console.log("");

  const result = await new ImageConverter().convertBatch({
    inputDir: values.input!,
    outputDir: values.output!,
    outputFormat: format,
    options: quality === undefined ? {} : { quality },
    overwrite: values.overwrite,
    recursive: values.recursive,
    debug: true,
  });

  if (result.failed) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
