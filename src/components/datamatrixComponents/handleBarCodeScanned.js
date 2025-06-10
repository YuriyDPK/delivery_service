// handleBarCodeScanned.js
import {customAlert} from './customAlertManager';

export const handleBarCodeScanned = ({
  event,
  scanned,
  setScanned,
  replaceLast,
  setReplaceLast,
  setDataMatrix,
}) => {
  if (scanned) return; // Предотвращаем повторное сканирование

  try {
    console.log('Начало сканирования DataMatrix кода...');

    if (!event || !event.nativeEvent) {
      console.error('Ошибка сканирования: отсутствуют данные события');
      customAlert(
        'Ошибка сканирования',
        'Не удалось получить данные сканирования. Попробуйте еще раз.',
      );
      return;
    }

    const newCode = event.nativeEvent.codeStringValue?.trim();

    if (!newCode) {
      console.error('Ошибка сканирования: пустой код');
      customAlert(
        'Ошибка сканирования',
        'Отсканированный код пуст или не распознан. Убедитесь, что DataMatrix код четкий и хорошо освещен.',
      );
      return;
    }

    console.log('Отсканирован код:', newCode);
    console.log('Тип кода:', event.nativeEvent.codeType || 'Неизвестный тип');

    // Проверка формата DataMatrix кода
    if (newCode.length < 10) {
      console.warn(
        'Предупреждение: отсканированный код слишком короткий для DataMatrix',
      );
      customAlert(
        'Возможно некорректный код',
        'Отсканированный код слишком короткий для стандартного DataMatrix. Проверьте правильность кода.',
      );
    }

    setScanned(true);

    if (replaceLast) {
      console.log('Режим замены последнего кода');
      setDataMatrix(prev => {
        if (!prev) return newCode;
        const parts = prev.split('\n');
        const oldCode = parts[parts.length - 1];
        console.log('Заменяем код:', oldCode, 'на:', newCode);
        parts[parts.length - 1] = newCode;
        return parts.join('\n');
      });
      setReplaceLast(false);
    } else {
      console.log('Режим добавления нового кода');
      setDataMatrix(prev => {
        const newValue = prev ? prev + '\n' + newCode : newCode;
        console.log('Обновленное значение DataMatrix:', newValue);
        return newValue;
      });
    }

    console.log('Сканирование DataMatrix кода успешно завершено');
  } catch (error) {
    console.error(
      'Критическая ошибка при сканировании DataMatrix кода:',
      error,
    );
    customAlert(
      'Ошибка сканирования',
      `Произошла ошибка при обработке DataMatrix кода: ${
        error.message || 'Неизвестная ошибка'
      }`,
    );
    setScanned(false); // Разрешаем повторное сканирование после ошибки
  }
};
