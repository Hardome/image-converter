import { afterEach, expect, test, vi } from "vitest";
import { formatBytes, formatDuration, formatSavings, logBatch } from "../src/logging.js";

afterEach(() => {
  vi.restoreAllMocks();
});

test("sizes and durations use suitable readable units", () => {
  expect(formatBytes(0)).toBe("0 Б");
  expect(formatBytes(512)).toBe("512 Б");
  expect(formatBytes(1536)).toBe("1,5 КБ");
  expect(formatBytes(1024 ** 2)).toBe("1 МБ");
  expect(formatBytes(1024 ** 3)).toBe("1 ГБ");

  expect(formatDuration(500)).toBe("500 мс");
  expect(formatDuration(1500)).toBe("1,5 с");
  expect(formatDuration(125_000)).toBe("2 мин 5 с");
  expect(formatDuration(3_725_000)).toBe("1 ч 2 мин 5 с");
});

test("larger output is reported as an increase, not negative savings", () => {
  expect(formatSavings(2048, 1024)).toBe("экономия: 1 КБ (50%)");
  expect(formatSavings(1024, 2048)).toBe("увеличение: 1 КБ (100%)");
  expect(formatSavings(1024, 1024)).toBe("размер не изменился");
  expect(formatSavings(0, 1024)).toBe("увеличение: 1 КБ");
});

test("summary counts savings only for files actually converted", () => {
  const log = vi.spyOn(console, "log").mockImplementation(() => {});

  logBatch({
    total: 3,
    converted: 1,
    skipped: 1,
    failed: 1,
    totalConversionTime: 1500,
    results: [
      { status: "converted", success: true, inputPath: "a.png", outputPath: "a.webp", originalSize: 4096, convertedSize: 1024 },
      { status: "skipped", success: false, inputPath: "b.png", outputPath: "b.webp", originalSize: 999999 },
      { status: "failed", success: false, inputPath: "c.png", outputPath: "c.webp", originalSize: 999999 },
    ],
  });

  const output = log.mock.calls.flat().join("\n");

  expect(output).toContain("обработано 1, пропущено 1, ошибок 1");
  expect(output).toContain("4 КБ → 1 КБ");
  expect(output).toContain("экономия: 3 КБ (75%)");
  expect(output).toContain("Затрачено времени: 1,5 с");
});
