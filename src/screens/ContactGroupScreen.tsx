import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { CustomText, AppToolbar } from '../components/common';
import { globalStyles } from '../styles/globalStyles';
import ContactGroupIcon from '../assets/icons/contactgroup.svg';

const ContactGroupScreen = () => {
  return (
    <View style={styles.container}>
      <AppToolbar title="Contact Group" />
      <ScrollView style={globalStyles.container} contentContainerStyle={styles.scrollContent}>

<view style={styles.topContactGroupSection}>
<View style={styles.topContent}>
<ContactGroupIcon/>
</View>
</view>

      </ScrollView>
    </View>
  );
};

export default ContactGroupScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', },
 
   scrollContent: {
    padding: 24,
    flexGrow: 1,
  },
  topContactGroupSection:{
 padding: 24,
 backgroundColor:'#FFF3D5',
 borderColor:'#FFB600',
 borderWidth:1
  },
  topContent:{
  flexGrow: 1,
  },
});

