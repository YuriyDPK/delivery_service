// SyncIndicator.tsx
import React from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';

const SyncIndicator = () => {
  return (
    <View style={styles.container}>
      <View style={styles.indicator}>
        <ActivityIndicator size="small" color="#ffffff" />
        <Text style={styles.text}>Идет синхронизация...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    alignItems: 'center',
  },
  indicator: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
    alignItems: 'center',
  },
  text: {
    color: '#ffffff',
    marginLeft: 8,
    fontSize: 14,
  },
});

export default SyncIndicator;
