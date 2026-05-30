/**
 * Theme Spacing Configuration
 * Based on the standard 8-point layout grid system.
 * Promotes high vertical and horizontal alignment consistency.
 */

export const spacing = {
  // Padding & Margin values
  xs: 4,      // Micro-spacing (tight layouts)
  sm: 8,      // Tiny spacing (inner element padding)
  md: 12,     // Medium spacing (card padding, default row gaps)
  lg: 16,     // Large spacing (standard screen margins, content blocks)
  xl: 24,     // Extra Large spacing (section spacing, main blocks)
  '2xl': 32,  // Double Extra Large spacing
  '3xl': 48,  // Triple Extra Large spacing
  '4xl': 64,  // Huge layouts

  // Standardized Border Radii for buttons, containers, and inputs
  borderRadius: {
    none: 0,
    xs: 4,      // Slight round (e.g. checkbox)
    sm: 8,      // Small round (e.g. small badge, text fields)
    md: 12,     // Standard round (e.g. cards, buttons)
    lg: 16,     // High round (e.g. modal sheets, main actions)
    xl: 24,     // Super round
    full: 9999, // Perfect circular clips (avatars, rounded buttons)
  },

  // Standardized Border Widths
  borderWidth: {
    none: 0,
    thin: 1,    // Subtle divider lines
    medium: 2,  // Active borders
    thick: 4,   // Highlight frames
  },
} as const;

export type SpacingType = typeof spacing;
export type SpacingKey = keyof Omit<SpacingType, 'borderRadius' | 'borderWidth'>;
