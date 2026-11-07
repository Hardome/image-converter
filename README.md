# Image Converter

Пакетная конвертация статических изображений на TypeScript и Sharp с сохранением структуры каталогов.

## Запуск

Требуется Node.js 22 или новее.

```sh
npm ci
npm run convert -- --input ./input --output ./output --format webp --quality 80
```

Без аргументов: `input/` → `output/`, формат WebP. `--overwrite` разрешает перезапись, `--help` показывает параметры.

## Программный API

```ts
import { ImageConverter } from './src/index.js';

const converter = new ImageConverter();
const result = await converter.convertSingleFile({
  inputPath: './input/photo.png',
  outputPath: './output/photo.webp',
  outputFormat: 'webp',
  options: { quality: 80 },
});

if (!result.success) {
  console.error(result.error);
}
```

Также доступны `convertBatch`, `convertMultiple`, `getFileInfo`. Пакетная обработка возвращает счётчики `converted`, `failed`, `skipped` и результаты отдельных файлов.

## Ограничения

- Вывод: JPEG, PNG, WebP, AVIF, TIFF, GIF. Кодеки зависят от сборки Sharp.
- Это конвертер статических изображений: сохранение анимации, HEIF и camera RAW не заявляются.
- Исходники сохраняются по умолчанию. Совпадающие входной и выходной пути запрещены.
- Коллизии имён внутри задания разрешаются суффиксами; существующие файлы без `overwrite` пропускаются.
- Выходной каталог исключается из обхода. Запись выполняется через временный файл.
- Ошибка отдельного файла не останавливает остальные; CLI возвращает ненулевой код при сбоях.
- `compressionRatio` — выходной размер / исходный размер, значение может превышать единицу.

## Проверки

```sh
npm run typecheck
npm test
npm run build
npm start -- --help
```

Тесты используют реальные небольшие изображения: расширения, коллизии имён, вложенный выходной каталог, повреждённые файлы, сохранность оригиналов.
