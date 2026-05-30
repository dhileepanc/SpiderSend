import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CustomText } from '../components/common';

const DirectSendScreen = () => {
  return (
    <View style={styles.container}>
      <CustomText variant="h2" style={styles.title}>Direct Send</CustomText>
      <CustomText variant="body" style={styles.sub}>Send campaigns directly to your contacts.</CustomText>
    </View>
  );
};

export default DirectSendScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  sub: { fontSize: 14, color: '#64748B', textAlign: 'center' },
});
