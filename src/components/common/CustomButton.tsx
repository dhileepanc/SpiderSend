import React from 'react';
import {
  Pressable,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { colors, spacing } from '../../theme';
import CustomText from './CustomText';

/**
 * Button Style Variants
 */
export type ButtonVariant = 'solid' | 'outline' | 'text';

/**
 * CustomButton Component Props
 */
export interface CustomButtonProps {
  /**
   * Action trigger callback
   */
  onPress: () => void;
  /**
   * Button title label
   */
  title: string;
  /**
   * Design variant style. Defaults to 'solid'.
   */
  variant?: ButtonVariant;
  /**
   * High-level accent color category. Defaults to 'primary'.
   */
  colorType?: 'primary' | 'secondary' | 'error' | 'success';
  /**
   * Loading/Spin state indicator. Replaces label with spinner.
   */
  loading?: boolean;
  /**
   * Disabled press interactions
   */
  disabled?: boolean;
  /**
   * Optional custom element inserted to the left of the title
   */
  leftIcon?: React.ReactNode;
  /**
   * Optional custom element inserted to the right of the title
   */
  rightIcon?: React.ReactNode;
  /**
   * Container outer layout styling overrides
   */
  style?: ViewStyle;
  /**
   * Title text styling overrides
   */
  textStyle?: TextStyle;
}

/**
 * CustomButton Component
 * Highly flexible press trigger providing interactive responsive touch scales
 * and built-in Activity Indicator loading layouts.
 */
export const CustomButton: React.FC<CustomButtonProps> = ({
  onPress,
  title,
  variant = 'solid',
  colorType = 'primary',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
}) => {
  const isInactive = disabled || loading;

  // Resolve color scheme mappings
  const colorMap = {
    primary: colors.primary,
    secondary: colors.secondary,
    error: colors.status.error,
    success: colors.status.success,
  };

  const scheme = colorMap[colorType];

  // Resolve background and borders based on states
  const getContainerStyle = (pressed: boolean): ViewStyle => {
    const base: ViewStyle = { ...styles.container };

    if (variant === 'solid') {
      base.backgroundColor = isInactive ? colors.neutral.gray300 : scheme.main;
      base.borderColor = 'transparent';
    } else if (variant === 'outline') {
      base.backgroundColor = 'transparent';
      base.borderColor = isInactive ? colors.neutral.gray300 : scheme.main;
      base.borderWidth = spacing.borderWidth.medium;
    } else {
      base.backgroundColor = 'transparent';
      base.borderColor = 'transparent';
    }

    // Micro-animation press scaling feedback
    if (pressed && !isInactive) {
      base.opacity = 0.85;
      base.transform = [{ scale: 0.98 }];
    }

    return base;
  };

  // Resolve text colors based on states
  const getTextColor = (): string => {
    if (isInactive) return colors.text.muted;
    if (variant === 'solid') return scheme.contrastText;
    return scheme.main;
  };

  const resolvedTextColor = getTextColor();

  return (
    <Pressable
      onPress={isInactive ? undefined : onPress}
      disabled={isInactive}
      style={({ pressed }) => [getContainerStyle(pressed), style]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'solid' ? scheme.contrastText : scheme.main}
        />
      ) : (
        <View style={styles.content}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <CustomText
            variant="button"
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[
              styles.text,
              { color: resolvedTextColor },
              textStyle,
            ]}
          >
            {title}
          </CustomText>
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 48,
    borderRadius: spacing.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
    fontFamily: 'Montserrat-SemiBold',
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
});

export default CustomButton;
