import { parseArgs } from "node:util";
import { ImageConverter, ImageFormat } from "./converter.js";

async function main() {
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
    throw new Error("Quality must be 1?100");
  const result = await new ImageConverter().convertBatch({
    inputDir: values.input!,
    outputDir: values.output!,
    outputFormat: values.format as ImageFormat,
    options: { quality },
    overwrite: values.overwrite,
    recursive: values.recursive,
  });
  console.log(JSON.stringify(result, null, 2));
  if (result.failed) process.exitCode = 1;
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
