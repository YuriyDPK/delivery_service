// AlertProvider.js
import React, {useState, useEffect} from 'react';
import {DeviceEventEmitter} from 'react-native';
import CustomAlert from './ui/CustomAlert';
import {ALERT_EVENTS} from './customAlertManager';

const AlertProvider = ({children}) => {
  const [visible, setVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    buttons: [{text: 'OK', onPress: () => {}}],
  });

  useEffect(() => {
    // Подписываемся на события показа/скрытия алерта
    const showSubscription = DeviceEventEmitter.addListener(
      ALERT_EVENTS.SHOW,
      config => {
        setAlertConfig(config);
        setVisible(true);
      },
    );

    const hideSubscription = DeviceEventEmitter.addListener(
      ALERT_EVENTS.HIDE,
      () => {
        setVisible(false);
      },
    );

    // Отписываемся при размонтировании компонента
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const onClose = () => {
    setVisible(false);
  };

  return (
    <>
      {children}
      <CustomAlert
        visible={visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={onClose}
      />
    </>
  );
};

export default AlertProvider;
