import { StyleSheet, Platform } from 'react-native';
import { colors, fonts, spacing } from '../theme';

/**
 * Global Stylesheet
 * Reusable core layout designs and helper utility classes.
 * Ensures consistent rendering of frames, margins, and elevations across modules.
 */
export const globalStyles = StyleSheet.create({
  // Flex Utilities
  flex1: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowAround: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selfCenter: {
    alignSelf: 'center',
  },

  // Screen Container Layouts
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
  },

  // Card / Surface styles (Glassmorphic & Standard premium containers)
  card: {
    backgroundColor: colors.background.paper,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.lg,
    marginVertical: spacing.sm,
    borderWidth: spacing.borderWidth.thin,
    borderColor: colors.border.light,
    ...Platform.select({
      ios: {
        shadowColor: colors.neutral.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },

  // High-fidelity Shadows
  shadowLight: {
    ...Platform.select({
      ios: {
        shadowColor: colors.neutral.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  shadowMedium: {
    ...Platform.select({
      ios: {
        shadowColor: colors.neutral.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  // Divider line helpers
  divider: {
    height: spacing.borderWidth.thin,
    backgroundColor: colors.border.light,
    width: '100%',
    marginVertical: spacing.md,
  },

  // Overlay layouts (used for loading layers or dark overlays)
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.4)', // slate-900 with alpha
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },

  // Form Field Containers
  formGroup: {
    marginBottom: spacing.lg,
    width: '100%',
  },

  // Text align utilities
  textCenter: {
    textAlign: 'center',
  },
  textRight: {
    textAlign: 'right',
  },
  textLeft: {
    textAlign: 'left',
  },
});

export type GlobalStylesType = typeof globalStyles;
