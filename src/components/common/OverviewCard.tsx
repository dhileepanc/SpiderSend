// components/OverviewCard.tsx

import React from 'react';
import {View, StyleSheet} from 'react-native';
import {CustomText} from '../common/CustomText';
import {fonts} from '../../theme';

interface Props {
  title: string;
  value: string | number;
  subtitle: string;
  Icon: React.FC<any>;
  color: string;
}

const OverviewCard = ({
  title,
  value,
  subtitle,
  Icon,
  color,
}: Props) => {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={{flex: 1}}>
          <CustomText style={[styles.title, {color}]}>
            {title}
          </CustomText>

          <CustomText style={styles.value}>
            {value}
          </CustomText>
        </View>

        <View>
          <Icon width={34} height={34} color={color} />
        </View>
      </View>

      <CustomText style={styles.subtitle}>
        {subtitle}
      </CustomText>
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
  },

  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
});