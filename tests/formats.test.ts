import { expect, test } from "vitest";
import { getFormatOptions, parseFormat } from "../src/formats.js";

test("aliases normalize and unsupported formats fail validation", () => {
  expect(parseFormat("JPG")).toBe("jpeg");
  expect(parseFormat("tif")).toBe("tiff");
  expect(() => parseFormat("unknown")).toThrow("Unsupported format");
});

test("undefined options do not erase default quality", () => {
  expect(getFormatOptions("webp", { quality: undefined })).toMatchObject({ quality: 80 });
  expect(getFormatOptions("webp", { quality: 90 })).toMatchObject({ quality: 90 });
});
