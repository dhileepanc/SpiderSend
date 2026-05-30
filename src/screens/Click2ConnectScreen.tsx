import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CustomText } from '../components/common';

const Click2ConnectScreen = () => {
  return (
    <View style={styles.container}>
      <CustomText variant="h2" style={styles.title}>Click2 Connect AI</CustomText>
      <CustomText variant="body" style={styles.sub}>Scan business cards and connect instantly.</CustomText>
    </View>
  );
};

export default Click2ConnectScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 8, textAlign: 'center' },
  sub: { fontSize: 14, color: '#64748B', textAlign: 'center' },
});
