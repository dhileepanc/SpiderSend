import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CustomText, AppToolbar } from '../components/common';

const MailTemplateScreen = () => {
  return (
    <View style={styles.container}>
      <AppToolbar title="Mail Template" />
      <View style={styles.body}>
        <CustomText variant="body" style={styles.sub}>Browse and manage your email templates.</CustomText>
      </View>
    </View>
  );
};

export default MailTemplateScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  body: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  sub: { fontSize: 14, color: '#64748B', textAlign: 'center' },
});

