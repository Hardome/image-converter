import {ImageConverter} from './converter';

async function main() {
  const converter = new ImageConverter();

  const batchResults = await converter.convertBatch({
    inputDir: './input',
    outputDir: './output',
    recursive: true,
    overwrite: false,
    deleteOriginal: false,
    debug: true
  });

  console.log(`Пакетная конвертация: ${batchResults.converted} успешно, ${batchResults.failed} с ошибками`);
}

// Запуск
main().catch((error) => {
  console.error('Ошибка выполнения:', error);

  process.exit(1);
});