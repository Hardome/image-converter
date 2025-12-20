import sharp, { FormatEnum } from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

// Поддерживаемые форматы из sharp
export type ImageFormat = keyof FormatEnum;

// Общие опции конвертации для всех форматов
export interface BaseConversionOptions {
  quality?: number;
  lossless?: boolean;
  compressionLevel?: number;
  effort?: number;
  progressive?: boolean;
}

// Специфичные опции для разных форматов
export interface WebPConversionOptions extends BaseConversionOptions {
  nearLossless?: boolean;
  alphaQuality?: number;
  preset?: 'default' | 'photo' | 'picture' | 'drawing' | 'icon' | 'text';
  smartSubsample?: boolean;
  reductionEffort?: number;
}

export interface JPEGConversionOptions extends BaseConversionOptions {
  mozjpeg?: boolean;
  chromaSubsampling?: string;
  optimizeCoding?: boolean;
  trellisQuantisation?: boolean;
  overshootDeringing?: boolean;
  optimiseScans?: boolean;
  quantisationTable?: number;
}

export interface PNGConversionOptions extends BaseConversionOptions {
  palette?: boolean;
  colours?: number;
  dither?: number;
  compressionLevel?: number;
  adaptiveFiltering?: boolean;
}

export interface AVIFConversionOptions extends BaseConversionOptions {
  speed?: number;
  chromaSubsampling?: '4:2:0' | '4:4:4';
}

export interface TIFFConversionOptions extends BaseConversionOptions {
  compression?: 'lzw' | 'deflate' | 'jpeg' | 'ccittfax4' | 'none';
  predictor?: 'horizontal' | 'float';
  pyramid?: boolean;
  tile?: boolean;
  tileWidth?: number;
  tileHeight?: number;
  xres?: number;
  yres?: number;
}

export type FormatSpecificOptions = 
  | WebPConversionOptions 
  | JPEGConversionOptions 
  | PNGConversionOptions 
  | AVIFConversionOptions 
  | TIFFConversionOptions;

// Определяем поддерживаемые форматы
export const SUPPORTED_FORMATS: ImageFormat[] = [
  'jpeg', 'jpg', 'png', 'webp', 'avif', 'tiff', 'gif', 'heif', 'raw'
];

export interface ConversionConfig {
  inputPath: string;
  outputPath?: string;
  outputFormat?: ImageFormat;
  options?: FormatSpecificOptions;
  overwrite?: boolean;
  deleteOriginal?: boolean;
  debug?: boolean;
}

export interface BatchConversionConfig {
  inputDir: string;
  outputDir: string;
  outputFormat?: ImageFormat;
  options?: FormatSpecificOptions;
  overwrite?: boolean;
  recursive?: boolean;
  deleteOriginal?: boolean;
  debug?: boolean;
}

export interface ConversionResult {
  success: boolean;
  inputPath: string;
  outputPath: string;
  inputFormat?: string;
  outputFormat?: string;
  error?: string;
  originalSize?: number;
  convertedSize?: number;
  compressionRatio?: number;
  conversionTime?: number;
}

export interface BatchConversionResults {
  converted: number;
  failed: number;
  skipped: number;
  total: number;
  results: ConversionResult[];
  totalConversionTime: number;
}

// Общие настройки для JPEG (jpg и jpeg используют одинаковые настройки)
const JPEG_OPTIONS = {
  quality: 80,
  progressive: true,
  chromaSubsampling: '4:4:4',
  optimizeCoding: true
} as const;

export class ImageConverter {
  private defaultOptions: Record<ImageFormat, any> = {
    jpeg: JPEG_OPTIONS,
    jpg: JPEG_OPTIONS,
    png: {
      quality: 80,
      compressionLevel: 6,
      palette: false,
      adaptiveFiltering: true
    },
    webp: {
      quality: 80,
      lossless: false,
      nearLossless: false,
      alphaQuality: 100,
      effort: 4,
      preset: 'default',
      smartSubsample: false,
      reductionEffort: 4
    },
    avif: {
      quality: 80,
      lossless: false,
      speed: 5,
      chromaSubsampling: '4:4:4'
    },
    tiff: {
      quality: 80,
      compression: 'lzw',
      predictor: 'horizontal'
    },
    gif: {
      quality: 80,
      colors: 256,
      dither: 1.0
    },
    heif: {
      quality: 80,
      compression: 'hevc'
    },
    raw: {
      quality: 100
    },
    dz: null,
    fits: null,
    input: null,
    jp2: null,
    jxl: null,
    magick: null,
    openslide: null,
    pdf: null,
    ppm: null,
    svg: null,
    tif: null,
    v: null
  };

  /**
   * Конвертирует один файл в любой поддерживаемый формат
   */
  async convertSingleFile(config: ConversionConfig): Promise<ConversionResult> {
    const startTime = Date.now();
    const result: ConversionResult = {
      success: false,
      inputPath: config.inputPath,
      outputPath: config.outputPath || this.getDefaultOutputPath(
        config.inputPath, 
        config.outputFormat
      ),
      conversionTime: 0
    };

    const debug = config.debug ?? false;
    const fileName = path.basename(config.inputPath);
    const outputFormat = config.outputFormat || this.getFormatFromPath(result.outputPath);

    try {
      // Проверка входного файла
      if (!fs.existsSync(config.inputPath)) {
        throw new Error(`Файл не существует: ${config.inputPath}`);
      }

      // Проверка формата
      if (!this.isFormatSupported(outputFormat)) {
        throw new Error(`Формат ${outputFormat} не поддерживается. Доступные форматы: ${SUPPORTED_FORMATS.join(', ')}`);
      }

      // Проверка существования выходного файла
      if (fs.existsSync(result.outputPath) && !config.overwrite) {
        result.success = false;
        result.error = 'Выходной файл уже существует, overwrite = false';

        if (debug) {
          console.log(`[DEBUG] Пропущен: ${fileName} - файл уже существует`);
        }

        return result;
      }

      if (debug) {
        console.log(`[DEBUG] Начало конвертации: ${fileName} → ${outputFormat}`);
      }

      // Получаем метаданные и размер исходного файла
      const metadata = await sharp(config.inputPath).metadata();
      const originalStats = fs.statSync(config.inputPath);
      result.inputFormat = metadata.format;

      if (debug) {
        console.log(`[DEBUG] Информация о файле ${fileName}:`);
        console.log(`[DEBUG]   Исходный формат: ${result.inputFormat}`);
        console.log(`[DEBUG]   Целевой формат: ${outputFormat}`);
        console.log(`[DEBUG]   Размер: ${this.formatBytes(originalStats.size)}`);
        console.log(`[DEBUG]   Разрешение: ${metadata.width}x${metadata.height}`);
        console.log(`[DEBUG]   Цветовое пространство: ${metadata.space}`);
        console.log(`[DEBUG]   Каналов: ${metadata.channels}`);
      }

      // Получаем опции для целевого формата
      const formatOptions = this.getFormatOptions(outputFormat, config.options || {});

      // Создаем экземпляр sharp с правильным выходным форматом
      // Нормализуем формат (jpg → jpeg) для единообразия
      const normalizedFormat = this.normalizeFormat(outputFormat);
      const sharpInstance = sharp(config.inputPath).toFormat(normalizedFormat, formatOptions);

      if (debug) {
        console.log(`[DEBUG] Параметры конвертации:`, formatOptions);
      }

      // Выполняем конвертацию
      await sharpInstance.toFile(result.outputPath);

      const convertedStats = fs.statSync(result.outputPath);
      const endTime = Date.now();

      result.success = true;
      result.outputFormat = this.normalizeFormat(outputFormat);
      result.originalSize = originalStats.size;
      result.convertedSize = convertedStats.size;
      result.compressionRatio = result.originalSize > 0 
        ? (result.convertedSize / result.originalSize) 
        : 0;
      result.conversionTime = endTime - startTime;

      if (debug) {
        console.log(`[DEBUG] Конвертация завершена: ${fileName}`);
        console.log(`[DEBUG]   Исходный размер: ${this.formatBytes(result.originalSize)}`);
        console.log(`[DEBUG]   Размер после конвертации: ${this.formatBytes(result.convertedSize)}`);
        console.log(`[DEBUG]   Коэффициент сжатия: ${(result.compressionRatio * 100).toFixed(2)}%`);
        console.log(`[DEBUG]   Экономия: ${((1 - result.compressionRatio) * 100).toFixed(2)}%`);
        console.log(`[DEBUG]   Время конвертации: ${result.conversionTime}ms`);
      }

      // Удаление оригинала при необходимости
      if (config.deleteOriginal && result.success) {
        if (debug) {
          console.log(`[DEBUG] Удаление исходного файла: ${fileName}`);
        }
        fs.unlinkSync(config.inputPath);
      }

    } catch (error) {
      const endTime = Date.now();
      result.success = false;
      result.outputFormat = this.normalizeFormat(outputFormat);
      result.error = error instanceof Error ? error.message : 'Unknown error';
      result.conversionTime = endTime - startTime;

      if (debug) {
        console.error(`[DEBUG] Ошибка при конвертации ${fileName}:`, result.error);
      }
    }

    return result;
  }

  /**
   * Конвертирует все изображения в директории в указанный формат
   */
  async convertBatch(config: BatchConversionConfig): Promise<BatchConversionResults> {
    const startTime = Date.now();
    const results: BatchConversionResults = {
      converted: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      results: [],
      totalConversionTime: 0
    };

    const debug = config.debug ?? false;
    const outputFormat = config.outputFormat || 'webp';

    try {
      // Проверка входной директории
      if (!fs.existsSync(config.inputDir)) {
        throw new Error(`Входная директория не существует: ${config.inputDir}`);
      }

      // Проверка формата
      if (!this.isFormatSupported(outputFormat)) {
        throw new Error(`Формат ${outputFormat} не поддерживается. Доступные форматы: ${SUPPORTED_FORMATS.join(', ')}`);
      }

      // Создание выходной директории
      if (!fs.existsSync(config.outputDir)) {
        fs.mkdirSync(config.outputDir, { recursive: true });
      }

      // Поиск всех поддерживаемых изображений
      const imageFiles = this.findImageFiles(config.inputDir, config.recursive ?? true);
      results.total = imageFiles.length;

      if (debug) {
        console.log(`[DEBUG] Найдено изображений для конвертации: ${results.total}`);
        console.log(`[DEBUG] Входная директория: ${config.inputDir}`);
        console.log(`[DEBUG] Выходная директория: ${config.outputDir}`);
        console.log(`[DEBUG] Целевой формат: ${outputFormat}`);
      }

      // Конвертация каждого файла
      for (let i = 0; i < imageFiles.length; i++) {
        const inputFile = imageFiles[i];
        const fileName = path.basename(inputFile);
        
        if (debug) {
          console.log(`\n[DEBUG] ========================================`);
          console.log(`[DEBUG] Конвертация ${i + 1}/${imageFiles.length}: ${fileName}`);
          console.log(`[DEBUG] ========================================`);
        }

        const relativePath = path.relative(config.inputDir, inputFile);
        const inputFormat = this.getFormatFromPath(inputFile);
        const normalizedOutputFormat = this.normalizeFormat(outputFormat);
        const outputFile = path.join(
          config.outputDir,
          relativePath.replace(new RegExp(`\\.${inputFormat}$`, 'i'), `.${normalizedOutputFormat}`)
        );

        // Создание поддиректорий при необходимости
        const outputDir = path.dirname(outputFile);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        // Конвертация файла
        const conversionResult = await this.convertSingleFile({
          inputPath: inputFile,
          outputPath: outputFile,
          outputFormat: outputFormat,
          options: config.options,
          overwrite: config.overwrite,
          deleteOriginal: config.deleteOriginal,
          debug: debug
        });

        results.results.push(conversionResult);

        // Обновление статистики
        if (conversionResult.success) {
          results.converted++;
        } else if (conversionResult.error?.includes('уже существует')) {
          results.skipped++;
        } else {
          results.failed++;
        }
      }

      // Итоговая статистика
      const endTime = Date.now();
      results.totalConversionTime = endTime - startTime;

      if (debug) {
        this.printBatchStatistics(results, debug);
      }

    } catch (error) {
      const endTime = Date.now();
      results.totalConversionTime = endTime - startTime;
      
      results.results.push({
        success: false,
        inputPath: config.inputDir,
        outputPath: config.outputDir,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      results.failed = results.total;
      
      if (debug) {
        console.error(`[DEBUG] Критическая ошибка:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }

    return results;
  }

  /**
   * Конвертирует несколько файлов с разными настройками
   */
  async convertMultiple(files: ConversionConfig[]): Promise<ConversionResult[]> {
    const results: ConversionResult[] = [];

    for (const fileConfig of files) {
      const result = await this.convertSingleFile(fileConfig);
      results.push(result);
    }

    return results;
  }

  /**
   * Получает информацию о файле без конвертации
   */
  async getFileInfo(filePath: string): Promise<{
    width: number;
    height: number;
    size: number;
    format: string;
    hasAlpha: boolean;
    channels: number;
    space: string;
  } | null> {
    try {
      const metadata = await sharp(filePath).metadata();
      const stats = fs.statSync(filePath);

      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        size: stats.size,
        format: metadata.format || 'unknown',
        hasAlpha: metadata.hasAlpha || false,
        channels: metadata.channels || 0,
        space: metadata.space || 'unknown'
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Проверяет, поддерживается ли формат
   */
  isFormatSupported(format: string): format is ImageFormat {
    return SUPPORTED_FORMATS.includes(format as ImageFormat);
  }

  /**
   * Получает список всех поддерживаемых форматов
   */
  getSupportedFormats(): string[] {
    return [...SUPPORTED_FORMATS];
  }

  /**
   * Находит все поддерживаемые изображения в директории
   */
  private findImageFiles(dir: string, recursive: boolean = true): string[] {
    const files: string[] = [];

    const scanDirectory = (currentDir: string) => {
      const items = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(currentDir, item.name);

        if (item.isDirectory() && recursive) {
          scanDirectory(fullPath);
        } else if (item.isFile()) {
          const format = this.getFormatFromPath(fullPath);
          if (this.isFormatSupported(format)) {
            files.push(fullPath);
          }
        }
      }
    };

    scanDirectory(dir);
    return files;
  }

  /**
   * Нормализует формат (jpg → jpeg, tif → tiff)
   */
  private normalizeFormat(format: string): ImageFormat {
    if (format === 'jpg') return 'jpeg';
    if (format === 'tif') return 'tiff';
    return format as ImageFormat;
  }

  /**
   * Определяет формат из пути к файлу
   */
  private getFormatFromPath(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase().replace('.', '');
    return this.normalizeFormat(ext);
  }

  /**
   * Генерирует путь для выходного файла по умолчанию
   */
  private getDefaultOutputPath(inputPath: string, outputFormat?: ImageFormat): string {
    const dir = path.dirname(inputPath);
    const name = path.basename(inputPath, path.extname(inputPath));
    const format = outputFormat || 'webp';
    
    return path.join(dir, `${name}.${format}`);
  }

  /**
   * Получает опции для конкретного формата
   */
  private getFormatOptions(format: ImageFormat, customOptions: any): any {
    // Нормализуем формат для получения правильных дефолтов
    const normalizedFormat = this.normalizeFormat(format);
    const defaults = this.defaultOptions[normalizedFormat] || {};
    
    // Сливаем дефолтные и пользовательские опции
    return { ...defaults, ...customOptions };
  }

  /**
   * Форматирует размер в байтах в читаемый формат
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const KB = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(KB));
    
    return `${(bytes / Math.pow(KB, i)).toFixed(2)} ${sizes[i]}`;
  }

  /**
   * Выводит статистику пакетной конвертации
   */
  private printBatchStatistics(results: BatchConversionResults, debug: boolean): void {
    let totalOriginalSize = 0;
    let totalConvertedSize = 0;
    let totalConversionTime = 0;
    
    for (const result of results.results) {
      if (result.success && result.originalSize && result.convertedSize) {
        totalOriginalSize += result.originalSize;
        totalConvertedSize += result.convertedSize;
      }
      if (result.conversionTime) {
        totalConversionTime += result.conversionTime;
      }
    }
    
    const overallSavingsPercent = totalOriginalSize > 0 
      ? ((1 - totalConvertedSize / totalOriginalSize) * 100).toFixed(2)
      : '0.00';
    
    const avgTimePerFile = results.converted > 0 
      ? (totalConversionTime / results.converted).toFixed(0)
      : '0';

    console.log(`\n[DEBUG] ========================================`);
    console.log(`[DEBUG] ИТОГИ КОНВЕРТАЦИИ:`);
    console.log(`[DEBUG]   Успешно: ${results.converted}`);
    console.log(`[DEBUG]   Пропущено: ${results.skipped}`);
    console.log(`[DEBUG]   Ошибок: ${results.failed}`);
    console.log(`[DEBUG]   Всего файлов: ${results.total}`);
    console.log(`[DEBUG]   Общее время: ${results.totalConversionTime}ms`);
    console.log(`[DEBUG]   Среднее время на файл: ${avgTimePerFile}ms`);
    console.log(`[DEBUG]   Общий размер исходных файлов: ${this.formatBytes(totalOriginalSize)}`);
    console.log(`[DEBUG]   Общий размер конвертированных файлов: ${this.formatBytes(totalConvertedSize)}`);
    console.log(`[DEBUG]   Общая экономия: ${overallSavingsPercent}%`);
    console.log(`[DEBUG] ========================================`);
  }
}