import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
  Text,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { fonts } from '../theme';

import HomeIcon from '../assets/icons/home.svg';
import HomeActiveIcon from '../assets/icons/home_active.svg';
import DirectSendIcon from '../assets/icons/directsend.svg';
import MailIcon from '../assets/icons/mail.svg';
import MailActiveIcon from '../assets/icons/mail_active.svg';
import ContactGroupIcon from '../assets/icons/contactgroup.svg';
import ContactGroupActiveIcon from '../assets/icons/connectgroup_active.svg';
import ScanIcon from '../assets/icons/connectaiscanner.svg';
import Click2ConnectIcon from '../assets/icons/click2connect.svg';

const { width } = Dimensions.get('window');

// ── Design tokens ────────────────────────────────────────────────────────────
const TAB_BAR_HEIGHT = 86;       // visible content height (increased)
const NOTCH_WIDTH = 116;         // total width of the curved notch
const NOTCH_DEPTH = 40;          // how deep the curve dips
const CENTER_BTN_SIZE = 70;      // diameter of the floating circle
const FLOAT_ABOVE = 14;          // px the button centre sits ABOVE bar top
const ACTIVE_COLOR = '#23A9BB';
const INACTIVE_COLOR = '#64748B';
const BAR_BG = '#ffffff';        // slightly off-white to contrast with pure white screens
const CENTER_BTN_BG = '#22242A'; // Dark slate/grey for the ScanIcon button

// ── Inline SVG icons ─────────────────────────────────────────────────────────

// ── Route helpers ─────────────────────────────────────────────────────────────
const getIcon = (routeName: string, focused: boolean, color: string) => {
  switch (routeName) {
    case 'Home': return focused ? <HomeActiveIcon width={24} height={24} /> : <HomeIcon width={24} height={24} />;
    case 'DirectSend': return <DirectSendIcon width={24} height={24} color={color} fill={color} />;
    case 'MailTemplate': return focused ? <MailActiveIcon width={24} height={24} /> : <MailIcon width={24} height={24} />;
    case 'ContactGroup': return focused ? <ContactGroupActiveIcon width={24} height={24} /> : <ContactGroupIcon width={24} height={24} />;
    default: return null;
  }
};

const getLabel = (routeName: string) => {
  switch (routeName) {
    case 'Home': return 'Home';
    case 'DirectSend': return 'Direct\nSend';
    case 'MailTemplate': return 'Mail\nTemplate';
    case 'ContactGroup': return 'Contact\nGroup';
    case 'Click2Connect': return 'Click2\nConnect AI';
    default: return routeName;
  }
};

// ── SVG curved path ───────────────────────────────────────────────────────────
// Creates a smooth wide U-shaped notch using quadratic beziers for a round feel.
// totalH = TAB_BAR_HEIGHT + bottomInset
const buildCurvedPath = (totalH: number) => {
  const cx = width / 2;
  const nw = NOTCH_WIDTH / 2;     // half notch width
  const nd = NOTCH_DEPTH;         // depth of the U
  const sw = 22;                  // shoulder width — how far the curve starts from notch edge

  return [
    `M 0 0`,
    `L ${cx - nw - sw} 0`,
    // Left shoulder: gentle curve inward then down
    `C ${cx - nw} 0 ${cx - nw} ${nd} ${cx} ${nd}`,
    // Right shoulder: curve back up and out
    `C ${cx + nw} ${nd} ${cx + nw} 0 ${cx + nw + sw} 0`,
    `L ${width} 0`,
    `L ${width} ${totalH}`,
    `L 0 ${totalH}`,
    `Z`,
  ].join(' ');
};

// ── Component ─────────────────────────────────────────────────────────────────
export const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  // Check if current focused screen requested to hide the tab bar
  const focusedRoute = state.routes[state.index];
  const focusedOptions = descriptors[focusedRoute.key].options;
  // @ts-ignore - tabBarStyle can be an object
  if (focusedOptions.tabBarStyle?.display === 'none') {
    return null;
  }

  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom;                     // system nav bar height
  const totalHeight = TAB_BAR_HEIGHT + bottomInset;     // full wrapper height

  // Button sits with its centre FLOAT_ABOVE px above the bar top edge.
  // bottom = distance from wrapper bottom to button's bottom edge.
  const centerBtnBottom = bottomInset + TAB_BAR_HEIGHT - CENTER_BTN_SIZE / 2 + FLOAT_ABOVE;

  const routes = state.routes;
  const centerIndex = Math.floor(routes.length / 2); // index 2 → Click2Connect

  const leftRoutes = routes.slice(0, centerIndex);
  const rightRoutes = routes.slice(centerIndex + 1);
  const centerRoute = routes[centerIndex];

  const renderTab = (route: typeof routes[0], index: number) => {
    const isFocused = state.index === index;
    const color = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;
    const { options } = descriptors[route.key];

    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <TouchableOpacity
        key={route.key}
        activeOpacity={0.7}
        onPress={onPress}
        style={styles.tabItem}
        accessibilityRole="button"
        accessibilityLabel={options.tabBarAccessibilityLabel}
      >
        {getIcon(route.name, isFocused, color)}
        <Text style={[styles.label, { color }]}>{getLabel(route.name)}</Text>
      </TouchableOpacity>
    );
  };

  const onCenterPress = () => {
    const event = navigation.emit({ type: 'tabPress', target: centerRoute.key, canPreventDefault: true });
    if (state.index !== centerIndex && !event.defaultPrevented) {
      navigation.navigate(centerRoute.name);
    }
  };

  // Centre button sits above the notch — its bottom edge aligns with the top
  // of the white bar, regardless of the system inset.


  return (
    <View style={[styles.wrapper, { height: totalHeight }]}>

      {/* Curved SVG background — fills full wrapper including inset zone */}
      <Svg
        width={width}
        height={totalHeight}
        style={StyleSheet.absoluteFill}
      >
        <Path 
          d={buildCurvedPath(totalHeight)} 
          fill={BAR_BG} 
          stroke="#CBD5E1" 
          strokeWidth={1.5} 
        />
      </Svg>

      {/* Tab icon/label row — constrained to the visible TAB_BAR_HEIGHT */}
      <View style={[styles.row, { height: TAB_BAR_HEIGHT }]}>
        <View style={styles.side}>
          {leftRoutes.map((route) => renderTab(route, routes.indexOf(route)))}
        </View>

        {/* Spacer behind the centre notch */}
        <View style={styles.centerSpace}>
          <View style={{ width: 24, height: 24 }} />
          <Text style={[styles.label, { color: state.index === centerIndex ? ACTIVE_COLOR : INACTIVE_COLOR }]}>
            {getLabel(centerRoute.name)}
          </Text>
        </View>

        <View style={styles.side}>
          {rightRoutes.map((route) => renderTab(route, routes.indexOf(route)))}
        </View>
      </View>

      {/* Floating centre button — positioned relative to wrapper */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onCenterPress}
        style={[
          styles.centerBtn,
          {
            bottom: centerBtnBottom,
            left: width / 2 - CENTER_BTN_SIZE / 2,
            width: CENTER_BTN_SIZE,
            height: CENTER_BTN_SIZE,
            borderRadius: CENTER_BTN_SIZE / 2,
          },
        ]}
      >
        <ScanIcon />
      </TouchableOpacity>
    </View>
  );
};

export default CustomTabBar;

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    width,
    backgroundColor: 'transparent',
    ...Platform.select({
      android: { elevation: 12 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  side: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: TAB_BAR_HEIGHT,
  },
  // Extra wide spacer so tab items don't overlap the notch area
  centerSpace: {
    width: NOTCH_WIDTH + 24,
    height: TAB_BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  label: {
    fontSize: 10,
    fontFamily: fonts.families.semibold,
    marginTop: 3,
    textAlign: 'center',
    lineHeight: 13,
  },
  centerBtn: {
    position: 'absolute',
    backgroundColor: CENTER_BTN_BG,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      android: { elevation: 10 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.28,
        shadowRadius: 10,
      },
    }),
  },
});
