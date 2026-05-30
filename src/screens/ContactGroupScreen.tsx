import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CustomText } from '../components/common';

const ContactGroupScreen = () => {
  return (
    <View style={styles.container}>
      <CustomText variant="h2" style={styles.title}>Contact Group</CustomText>
      <CustomText variant="body" style={styles.sub}>Organise and manage your contact groups.</CustomText>
    </View>
  );
};

export default ContactGroupScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  sub: { fontSize: 14, color: '#64748B', textAlign: 'center' },
});
