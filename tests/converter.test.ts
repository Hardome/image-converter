import { test } from "vitest";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";

sharp.cache(false);

import { ImageConverter } from "../converter.js";

test("batch handles aliases, collisions, nested output and corrupt files", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "converter-"));

  try {
    const input = path.join(root, "in"),
      out = path.join(input, "out");
      
    await fs.mkdir(input);
    await sharp({
      create: { width: 4, height: 4, channels: 3, background: "red" },
    })
      .jpeg()
      .toFile(path.join(input, "a.jpg"));

    await sharp({
      create: { width: 4, height: 4, channels: 3, background: "blue" },
    })
      .png()
      .toFile(path.join(input, "a.png"));

    await fs.writeFile(path.join(input, "broken.png"), "invalid");

    const c = new ImageConverter();
    const r = await c.convertBatch({ inputDir: input, outputDir: out });

    assert.equal(r.converted, 2);
    assert.equal(r.failed, 1);
    assert.equal(
      (await sharp(path.join(out, "a.webp")).metadata()).format,
      "webp",
    );
    assert.equal((await fs.readdir(out)).length, 2);

    const again = await c.convertBatch({ inputDir: input, outputDir: out });

    assert.equal(again.total, 3);
    assert.equal(again.skipped, 2);

    const same = await c.convertSingleFile({
      inputPath: path.join(input, "a.jpg"),
      outputPath: path.join(input, "a.jpg"),
      overwrite: true,
      deleteOriginal: true,
    });

    assert.equal(same.success, false);

    await fs.access(path.join(input, "a.jpg"));
  } finally {
    await fs.rm(root, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 100,
    });
  }
});
