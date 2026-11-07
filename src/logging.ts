import type { BatchConversionResults, ConversionResult } from "./types.js";
import path from "node:path";

const number = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });

export function formatBytes(bytes: number): string {
  const units = ["Б", "КБ", "МБ", "ГБ", "ТБ"];
  const magnitude = Math.abs(bytes);
  const index = magnitude < 1 ? 0 : Math.min(Math.floor(Math.log(magnitude) / Math.log(1024)), units.length - 1);

  return `${number.format(bytes / 1024 ** index)} ${units[index]}`;
}

export function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) return `${number.format(milliseconds)} мс`;
  if (milliseconds < 60_000) return `${number.format(milliseconds / 1000)} с`;

  const seconds = Math.round(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  if (minutes < 60) return `${minutes} мин ${remainder} с`;
  return `${Math.floor(minutes / 60)} ч ${minutes % 60} мин ${remainder} с`;
}

export function formatSavings(original: number, converted: number): string {
  const difference = original - converted;
  if (difference === 0) return "размер не изменился";

  const percent = original > 0 ? ` (${number.format(Math.abs(difference) / original * 100)}%)` : "";
  const label = difference > 0 ? "экономия" : "увеличение";

  return `${label}: ${formatBytes(Math.abs(difference))}${percent}`;
}

export function logConversion(result: ConversionResult): void {
  const name = path.basename(result.inputPath);

  if (result.status === "skipped") {
    console.log(`Пропущено: ${name} — результат уже существует`);
    return;
  }

  if (result.status === "failed") {
    console.error(`Ошибка: ${name} — ${result.error ?? "не удалось обработать файл"}`);
    return;
  }

  const original = result.originalSize ?? 0;
  const converted = result.convertedSize ?? 0;

  console.log(`Готово: ${name} → ${path.basename(result.outputPath)}`);
  console.log(`  ${formatBytes(original)} → ${formatBytes(converted)}; ${formatSavings(original, converted)}; ${formatDuration(result.conversionTime ?? 0)}`);

  if (result.warning) console.warn(`  Предупреждение: ${result.warning}`);
}

export function logBatch(result: BatchConversionResults): void {
  console.log("");
  console.log(`Итого: найдено ${result.total}, обработано ${result.converted}, пропущено ${result.skipped}, ошибок ${result.failed}`);

  if (result.converted > 0) {
    const successful = result.results.filter(file => file.status === "converted");
    const original = successful.reduce((sum, file) => sum + (file.originalSize ?? 0), 0);
    const converted = successful.reduce((sum, file) => sum + (file.convertedSize ?? 0), 0);

    console.log(`Размер обработанных файлов: ${formatBytes(original)} → ${formatBytes(converted)}`);
    console.log(`Суммарно — ${formatSavings(original, converted)}`);
  } else if (result.total === 0 && result.failed === 0) {
    console.log("Подходящих изображений не найдено.");
  }

  console.log(`Затрачено времени: ${formatDuration(result.totalConversionTime)}`);
}
