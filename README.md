# Image Converter

Универсальный конвертер изображений на TypeScript с поддержкой множества форматов. Использует библиотеку Sharp для высокопроизводительной обработки изображений.

## 🚀 Возможности

- ✅ Конвертация между различными форматами изображений
- ✅ Пакетная обработка файлов
- ✅ Рекурсивная обработка директорий
- ✅ Настраиваемые параметры качества и сжатия
- ✅ Подробная статистика конвертации
- ✅ Поддержка альфа-канала
- ✅ Режим отладки с детальным логированием
- ✅ Автоматическое создание выходных директорий

## 📦 Поддерживаемые форматы

- **JPEG/JPG** - с поддержкой прогрессивной загрузки
- **PNG** - с поддержкой альфа-канала
- **WebP** - современный формат с отличным сжатием
- **AVIF** - новейший формат с превосходным качеством
- **TIFF** - для профессиональной обработки
- **GIF** - анимированные изображения
- **HEIF** - формат Apple
- **RAW** - сырые изображения

## 📥 Установка

```bash
# Установка зависимостей
npm install

# Сборка проекта
npm run build
```

## 🎯 Использование

### Базовый пример

```typescript
import { ImageConverter } from './converter';

async function main() {
  const converter = new ImageConverter();

  // Пакетная конвертация PNG в WebP
  const results = await converter.convertBatch({
    inputDir: './input',
    outputDir: './output',
    outputFormat: 'webp',
    recursive: true,
    overwrite: false,
    deleteOriginal: false,
    debug: true
  });

  console.log(`Конвертировано: ${results.converted}`);
  console.log(`Ошибок: ${results.failed}`);
}
```

### Конвертация одного файла

```typescript
const result = await converter.convertSingleFile({
  inputPath: './images/photo.png',
  outputPath: './output/photo.webp',
  outputFormat: 'webp',
  webpOptions: {
    quality: 90,
    effort: 6,
    preset: 'photo'
  },
  overwrite: true,
  deleteOriginal: false
});

if (result.success) {
  console.log(`Сжатие: ${result.compressionRatio?.toFixed(2)}x`);
  console.log(`Экономия: ${((1 - result.compressionRatio!) * 100).toFixed(2)}%`);
}
```

### Конвертация нескольких файлов с разными настройками

```typescript
const results = await converter.convertMultiple([
  {
    inputPath: './screenshots/screen1.png',
    outputPath: './optimized/screen1.webp',
    outputFormat: 'webp',
    webpOptions: {
      quality: 75,
      nearLossless: 80,
      smartSubsample: true
    }
  },
  {
    inputPath: './photos/photo.jpg',
    outputPath: './optimized/photo.avif',
    outputFormat: 'avif',
    avifOptions: {
      quality: 90,
      speed: 5
    }
  }
]);
```

### Получение информации о файле

```typescript
const info = await converter.getFileInfo('./images/photo.png');
if (info) {
  console.log(`Размер: ${info.width}x${info.height}`);
  console.log(`Формат: ${info.format}`);
  console.log(`Размер файла: ${info.size} байт`);
  console.log(`Альфа-канал: ${info.hasAlpha ? 'Да' : 'Нет'}`);
}
```

## ⚙️ Параметры конфигурации

### ConversionConfig

| Параметр | Тип | Описание | По умолчанию |
|----------|-----|----------|--------------|
| `inputPath` | `string` | Путь к входному файлу | **обязательно** |
| `outputPath` | `string` | Путь к выходному файлу | Автоматически |
| `outputFormat` | `ImageFormat` | Целевой формат | Определяется из `outputPath` |
| `options` | `FormatSpecificOptions` | Параметры конвертации | Зависит от формата |
| `overwrite` | `boolean` | Перезаписывать существующие файлы | `false` |
| `deleteOriginal` | `boolean` | Удалять исходный файл после конвертации | `false` |
| `debug` | `boolean` | Режим отладки | `false` |

### BatchConversionConfig

| Параметр | Тип | Описание | По умолчанию |
|----------|-----|----------|--------------|
| `inputDir` | `string` | Входная директория | **обязательно** |
| `outputDir` | `string` | Выходная директория | **обязательно** |
| `outputFormat` | `ImageFormat` | Целевой формат | `webp` |
| `options` | `FormatSpecificOptions` | Параметры конвертации | Зависит от формата |
| `recursive` | `boolean` | Рекурсивная обработка поддиректорий | `true` |
| `overwrite` | `boolean` | Перезаписывать существующие файлы | `false` |
| `deleteOriginal` | `boolean` | Удалять исходные файлы | `false` |
| `debug` | `boolean` | Режим отладки | `false` |

## 🎨 Параметры форматов

### WebP

```typescript
webpOptions: {
  quality: 80,              // Качество (0-100)
  lossless: false,          // Без потерь
  nearLossless: false,      // Почти без потерь
  alphaQuality: 100,        // Качество альфа-канала
  effort: 4,                // Усилие сжатия (0-6)
  preset: 'default',        // Пресет: 'default' | 'photo' | 'picture' | 'drawing' | 'icon' | 'text'
  smartSubsample: false,    // Умная субдискретизация
  reductionEffort: 4        // Усилие редукции
}
```

### JPEG

```typescript
jpegOptions: {
  quality: 80,              // Качество (0-100)
  progressive: true,        // Прогрессивная загрузка
  chromaSubsampling: '4:4:4', // Субдискретизация цветности
  optimizeCoding: true,     // Оптимизация кодирования
  mozjpeg: false           // Использовать MozJPEG
}
```

### PNG

```typescript
pngOptions: {
  quality: 80,              // Качество (0-100)
  compressionLevel: 6,     // Уровень сжатия (0-9)
  palette: false,           // Использовать палитру
  adaptiveFiltering: true, // Адаптивная фильтрация
  colours: 256              // Количество цветов
}
```

### AVIF

```typescript
avifOptions: {
  quality: 80,              // Качество (0-100)
  lossless: false,          // Без потерь
  speed: 5,                 // Скорость кодирования (0-10)
  chromaSubsampling: '4:4:4' // Субдискретизация
}
```

## 📊 Результаты конвертации

### ConversionResult

```typescript
{
  success: boolean;           // Успешность конвертации
  inputPath: string;          // Путь к исходному файлу
  outputPath: string;         // Путь к выходному файлу
  inputFormat?: string;       // Исходный формат
  outputFormat?: string;      // Выходной формат
  error?: string;             // Сообщение об ошибке
  originalSize?: number;      // Размер исходного файла (байт)
  convertedSize?: number;     // Размер конвертированного файла (байт)
  compressionRatio?: number;  // Коэффициент сжатия (0-1)
  conversionTime?: number;    // Время конвертации (мс)
}
```

### BatchConversionResults

```typescript
{
  converted: number;          // Количество успешно конвертированных
  failed: number;             // Количество ошибок
  skipped: number;            // Количество пропущенных
  total: number;              // Всего файлов
  results: ConversionResult[]; // Детальные результаты
  totalConversionTime: number; // Общее время (мс)
}
```

## 🛠️ Скрипты

```bash
# Запуск конвертации (TypeScript)
npm run convert

# Сборка проекта
npm run build

# Запуск скомпилированного кода
npm start
```

## 📝 Примеры использования

### Конвертация PNG в WebP с высоким качеством

```typescript
await converter.convertBatch({
  inputDir: './input',
  outputDir: './output',
  outputFormat: 'webp',
  webpOptions: {
    quality: 95,
    effort: 6,
    preset: 'photo'
  }
});
```

### Конвертация в AVIF для веб-оптимизации

```typescript
await converter.convertBatch({
  inputDir: './images',
  outputDir: './optimized',
  outputFormat: 'avif',
  avifOptions: {
    quality: 80,
    speed: 5
  }
});
```

### Конвертация с удалением оригиналов

```typescript
await converter.convertBatch({
  inputDir: './photos',
  outputDir: './webp-photos',
  outputFormat: 'webp',
  deleteOriginal: true,
  overwrite: true
});
```

## 🔍 Режим отладки

Включите режим отладки для получения подробной информации о процессе конвертации:

```typescript
await converter.convertBatch({
  inputDir: './input',
  outputDir: './output',
  debug: true  // Включает детальное логирование
});
```

В режиме отладки выводится:
- Информация о каждом файле (размер, разрешение, формат)
- Параметры конвертации
- Результаты сжатия и экономия места
- Время конвертации каждого файла
- Итоговая статистика

## 📚 API

### Методы класса ImageConverter

- `convertSingleFile(config: ConversionConfig): Promise<ConversionResult>` - Конвертация одного файла
- `convertBatch(config: BatchConversionConfig): Promise<BatchConversionResults>` - Пакетная конвертация
- `convertMultiple(files: ConversionConfig[]): Promise<ConversionResult[]>` - Конвертация нескольких файлов
- `getFileInfo(filePath: string): Promise<FileInfo | null>` - Получение информации о файле
- `isFormatSupported(format: string): boolean` - Проверка поддержки формата
- `getSupportedFormats(): string[]` - Список поддерживаемых форматов

## 🐛 Обработка ошибок

Все методы возвращают объекты результатов с полем `success` и опциональным `error`. Проверяйте результат перед использованием:

```typescript
const result = await converter.convertSingleFile({...});

if (!result.success) {
  console.error(`Ошибка: ${result.error}`);
} else {
  console.log(`Успешно! Сжатие: ${result.compressionRatio}x`);
}
```
