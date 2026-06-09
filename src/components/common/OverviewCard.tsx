import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CustomText } from '../common/CustomText';
import { fonts } from '../../theme';

interface Props {
  title: string;
  value: string | number;
  subtitle: string;
  Icon: React.FC<any>;
  color: string;
  showProgress?: boolean;
  progressValue?: number; // used count
  progressTotal?: number; // total count
}

const OverviewCard = ({
  title,
  value,
  subtitle,
  Icon,
  color,
  showProgress,
  progressValue,
  progressTotal,
}: Props) => {
  const progress =
    showProgress && progressTotal
      ? Math.min(Number(progressValue || 0) / Number(progressTotal), 1)
      : 0;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <CustomText
            style={[styles.title, { color }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {title}
          </CustomText>
          <CustomText style={styles.value} numberOfLines={1}>{value}</CustomText>
        </View>
        <View>
          <Icon width={34} height={34} color={color} />
        </View>
      </View>

      {showProgress ? (
        <View style={styles.progressWrapper}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress * 100}%`, backgroundColor: color },
              ]}
            />
          </View>
        </View>
      ) : (
        <CustomText style={styles.subtitle}>{subtitle}</CustomText>
      )}
    </View>
  );
};

export default OverviewCard;

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 90,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 12,
    fontFamily: fonts.families.bold,
  },
  value: {
    fontSize: 14,
    fontFamily: fonts.families.bold,
    marginTop: 2,
    color: '#000',
  },
  subtitle: {
    fontFamily: fonts.families.medium,
    fontSize: 8,
    color: '#333333',
    marginTop: 6,
  },
  progressWrapper: {
    marginTop: 10,
  },
  progressTrack: {
    height: 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 10,
  },
});