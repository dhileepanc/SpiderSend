import React from 'react';
import { Text, TextProps, StyleSheet, TextStyle } from 'react-native';
import { colors, fonts } from '../../theme';

/**
 * Text Typography Variant Keys
 */
export type TextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bodyLarge'
  | 'body'
  | 'caption'
  | 'button';

/**
 * CustomText Component Props
 */
export interface CustomTextProps extends TextProps {
  /**
   * Font scale variant style. Defaults to 'body'.
   */
  variant?: TextVariant;
  /**
   * Text color override. Accepts a hex string or a path override.
   */
  color?: string;
  /**
   * Font weight override.
   */
  weight?: keyof typeof fonts.weights;
  /**
   * Text alignment option.
   */
  align?: 'left' | 'center' | 'right' | 'justify';
  /**
   * Children components
   */
  children?: React.ReactNode;
}

/**
 * CustomText Component
 * Enforces unified spacing, font weights, and color scales across all platforms.
 */
export const CustomText: React.FC<CustomTextProps> = ({
  variant = 'body',
  color,
  weight,
  align = 'left',
  style,
  children,
  ...props
}) => {
  // Determine standard colors
  const resolvedColor = color || colors.text.primary;

  // Determine standard font weight from variant
  let resolvedWeight: keyof typeof fonts.weights = 'regular';
  if (weight) {
    resolvedWeight = weight;
  } else if (variant === 'h1' || variant === 'h2' || variant === 'h3') {
    resolvedWeight = 'bold';
  } else if (variant === 'button') {
    resolvedWeight = 'semibold';
  }

  let family = fonts.families.regular;
  if (resolvedWeight === 'medium') family = fonts.families.medium;
  else if (resolvedWeight === 'semibold') family = fonts.families.semibold;
  else if (resolvedWeight === 'bold') family = fonts.families.bold;
  else if (resolvedWeight === 'extrabold') family = fonts.families.extrabold;

  // Build combined text style
  const textStyles: TextStyle[] = [
    styles.base,
    styles[variant],
    {
      color: resolvedColor,
      fontFamily: family,
      fontWeight: fonts.weights[resolvedWeight],
      textAlign: align,
    },
    style as TextStyle,
  ];

  return (
    <Text style={textStyles} {...props}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    fontFamily: fonts.families.regular,
  },
  h1: {
    fontSize: fonts.sizes['4xl'],
    lineHeight: fonts.lineHeights['4xl'],
  },
  h2: {
    fontSize: fonts.sizes['3xl'],
    lineHeight: fonts.lineHeights['3xl'],
  },
  h3: {
    fontSize: fonts.sizes['2xl'],
    lineHeight: fonts.lineHeights['2xl'],
  },
  bodyLarge: {
    fontSize: fonts.sizes.lg,
    lineHeight: fonts.lineHeights.lg,
  },
  body: {
    fontSize: fonts.sizes.md,
    lineHeight: fonts.lineHeights.md,
  },
  caption: {
    fontSize: fonts.sizes.xs,
    lineHeight: fonts.lineHeights.xs,
  },
  button: {
    fontSize: fonts.sizes.lg,
    lineHeight: fonts.lineHeights.lg,
  },
});

export default CustomText;
