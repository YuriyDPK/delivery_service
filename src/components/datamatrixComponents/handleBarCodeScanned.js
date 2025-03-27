// handleBarCodeScanned.js

export const handleBarCodeScanned = ({
  event,
  scanned,
  setScanned,
  replaceLast,
  setReplaceLast,
  setDataMatrix,
}) => {
  if (scanned) return; // Предотвращаем повторное сканирование
  setScanned(true);
  const newCode = event.nativeEvent.codeStringValue.trim();

  if (replaceLast) {
    setDataMatrix(prev => {
      if (!prev) return newCode;
      const parts = prev.split('\n');
      parts[parts.length - 1] = newCode;
      return parts.join('\n');
    });
    setReplaceLast(false);
  } else {
    setDataMatrix(prev => (prev ? prev + '\n' + newCode : newCode));
  }
};
