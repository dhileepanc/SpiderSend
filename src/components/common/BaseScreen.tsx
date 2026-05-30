import React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  StatusBar,
  StyleSheet,
  Platform,
  RefreshControl,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';


export interface BaseScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  safeTop?: boolean;
  safeBottom?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
  refreshing?: boolean;
  onRefresh?: () => void;
  statusBarColor?: string;
  barStyle?: 'light-content' | 'dark-content' | 'default';
}

export const BaseScreen: React.FC<BaseScreenProps> = ({
  children,
  scrollable = false,
  safeTop = true,
  safeBottom = true,
  style,
  contentContainerStyle,
  keyboardShouldPersistTaps = 'handled',
  refreshing = false,
  onRefresh,
  statusBarColor,
  barStyle,
}) => {
  const { theme, themeMode } = useApp();
  const insets = useSafeAreaInsets();

  // Resolve status bar parameters dynamically based on current theme settings
  const defaultBarStyle = themeMode === 'dark' ? 'light-content' : 'dark-content';
  const resolvedBarStyle = barStyle || defaultBarStyle;
  const resolvedStatusBarColor = statusBarColor || theme.colors.background;

  // Resolve safe area paddings manually so we have 100% control over offsets
  const topPadding = safeTop ? insets.top : 0;
  const bottomPadding = safeBottom ? insets.bottom : 0;

  const containerStyle = [
    styles.container,
    {
      backgroundColor: theme.colors.background,
      paddingTop: topPadding,
      paddingBottom: bottomPadding,
    },
    style,
  ];

  const renderContent = () => {
    if (scrollable) {
      return (
        <ScrollView
          style={styles.flex1}
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      );
    }

    return (
      <View style={[styles.flex1, contentContainerStyle]}>
        {children}
      </View>
    );
  };

  return (
    <View style={containerStyle}>
      <StatusBar
        backgroundColor={resolvedStatusBarColor}
        barStyle={resolvedBarStyle}
        translucent
      />
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {renderContent()}
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});

export default BaseScreen;
