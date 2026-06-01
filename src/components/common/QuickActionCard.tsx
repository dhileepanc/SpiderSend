import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { fonts } from '../../theme';
import { CustomText } from './CustomText';

interface Props {
  title: string;
  subTitle: string;
  Icon: React.FC<any>;
  borderColor: string;
  backgroundColor: string;
  onPress: () => void;
}

const QuickActionCard = ({ title, subTitle, Icon, borderColor, backgroundColor, onPress }: Props) => {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor, borderColor }]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <View style={styles.topContent}>
        <CustomText style={styles.title}>{title}</CustomText>
        <CustomText style={styles.subTitle}>{subTitle}</CustomText>
      </View>
      <View style={styles.iconWrapper}>
        <Icon width={44} height={44} color={borderColor} />
      </View>
    </TouchableOpacity>
  );
};

export default QuickActionCard;

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 14,
    minHeight: 150,
    justifyContent: 'space-between',
  },
  topContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: fonts.families.bold,
    fontWeight: fonts.weights.bold,
    color: '#111',
    
  },
  subTitle: {
    fontSize: 12,
    fontFamily: fonts.families.medium,
    color: '#555',
    lineHeight: 18,
  },
  iconWrapper: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
});