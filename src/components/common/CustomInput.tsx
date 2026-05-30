import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
  TextStyle,
  Pressable,
} from 'react-native';
import { colors, spacing, fonts } from '../../theme';
import CustomText from './CustomText';

/**
 * CustomInput Props extending standard React Native TextInputProps
 */
export interface CustomInputProps extends TextInputProps {
  /**
   * Top description label for the input field
   */
  label?: string;
  /**
   * Error message to highlight validation issues
   */
  error?: string;
  /**
   * Optional custom node to display on the left of the input field
   */
  leftIcon?: React.ReactNode;
  /**
   * Optional custom node to display on the right of the input field
   */
  rightIcon?: React.ReactNode;
  /**
   * Style overrides for the outer container wrapping label, input, and error
   */
  containerStyle?: ViewStyle;
  /**
   * Style overrides for the input row (including icons)
   */
  inputRowStyle?: ViewStyle;
  /**
   * Style overrides for the actual TextInput element
   */
  inputStyle?: TextStyle;
}

/**
 * CustomInput Component
 * Production-ready input element equipped with focus highlights,
 * error state styling, and automatic password toggle.
 */
export const CustomInput: React.FC<CustomInputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  secureTextEntry,
  containerStyle,
  inputRowStyle,
  inputStyle,
  onFocus,
  onBlur,
  editable = true,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isPassword = secureTextEntry;

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
  };

  // Determine border and highlight colors based on focus / errors / editability
  const getBorderColor = (): string => {
    if (error) return colors.status.error.main;
    if (isFocused) return colors.primary.main;
    return colors.border.light;
  };

  const getBackgroundColor = (): string => {
    if (!editable) return colors.neutral.gray100;
    return colors.background.paper;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Field Label */}
      {label && (
        <CustomText
          variant="caption"
          weight="semibold"
          color={error ? colors.status.error.main : colors.text.secondary}
          style={styles.label}
        >
          {label}
        </CustomText>
      )}

      {/* Input Row Wrapper */}
      <View
        style={[
          styles.inputRow,
          {
            borderColor: getBorderColor(),
            backgroundColor: getBackgroundColor(),
          },
          inputRowStyle,
        ]}
      >
        {/* Left Accessory */}
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

        {/* Core Input Field */}
        <TextInput
          style={[
            styles.textInput,
            {
              color: editable ? colors.text.primary : colors.text.muted,
            },
            inputStyle,
          ]}
          placeholderTextColor={colors.text.muted}
          secureTextEntry={isPassword && !isPasswordVisible}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={editable}
          {...props}
        />

        {/* Right Accessory (or Password Visibility Toggle) */}
        {isPassword ? (
          <Pressable
            onPress={togglePasswordVisibility}
            style={styles.passwordToggle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <CustomText
              variant="caption"
              weight="bold"
              color={colors.primary.main}
            >
              {isPasswordVisible ? 'HIDE' : 'SHOW'}
            </CustomText>
          </Pressable>
        ) : (
          rightIcon && <View style={styles.iconRight}>{rightIcon}</View>
        )}
      </View>

      {/* Field Validation Error */}
      {error && (
        <CustomText
          variant="caption"
          color={colors.status.error.main}
          style={styles.errorText}
        >
          {error}
        </CustomText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    width: '100%',
  },
  label: {
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: spacing.borderWidth.thin,
    borderRadius: spacing.borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontFamily: fonts.families.regular,
    fontSize: fonts.sizes.md,
    paddingVertical: 0,
  },
  iconLeft: {
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconRight: {
    marginLeft: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordToggle: {
    marginLeft: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: spacing.xs,
    fontSize: fonts.sizes.xs,
  },
});

export default CustomInput;
