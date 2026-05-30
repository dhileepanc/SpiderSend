import React from 'react';
import {
  StyleSheet,
  ActivityIndicator,
  Modal,
  View,
  ViewStyle,
} from 'react-native';
import { colors, spacing } from '../../theme';
import CustomText from './CustomText';

/**
 * Loader Component Props
 */
export interface LoaderProps {
  /**
   * Visible control flag to mount/display modal overlay.
   */
  visible: boolean;
  /**
   * Optional helper text to display under the activity spinner.
   */
  message?: string;
  /**
   * Custom overlay background color overlay override.
   */
  backgroundColor?: string;
  /**
   * Activity spinner color override. Defaults to primary brand color.
   */
  spinnerColor?: string;
  /**
   * ViewStyle override.
   */
  style?: ViewStyle;
}

/**
 * Loader Component
 * Polished, full-screen blocking overlay loader designed for critical transactions,
 * API requests, or authentication operations.
 */
export const Loader: React.FC<LoaderProps> = ({
  visible,
  message,
  backgroundColor,
  spinnerColor = colors.primary.main,
  style,
}) => {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={() => {}} // Block back-button close on Android during active load
    >
      <View
        style={[
          styles.overlay,
          backgroundColor ? { backgroundColor } : null,
          style,
        ]}
      >
        <View style={styles.container}>
          <ActivityIndicator size="large" color={spinnerColor} />
          {message ? (
            <CustomText
              variant="body"
              weight="semibold"
              color={colors.text.inverse}
              align="center"
              style={styles.messageText}
            >
              {message}
            </CustomText>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)', // slate-900 with high opacity for premium overlay
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: spacing.xl,
    borderRadius: spacing.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageText: {
    marginTop: spacing.md,
    letterSpacing: 0.5,
    maxWidth: 240,
  },
});

export default Loader;
