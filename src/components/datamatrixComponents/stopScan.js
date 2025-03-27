// stopScan.js

export const stopScan = (manager, setScanningBle) => {
  if (manager) {
    manager.stopDeviceScan();
    setScanningBle(false);
  }
};
