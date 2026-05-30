/**
 * TypeScript module declaration for SVG files.
 * Allows importing .svg files as React components using react-native-svg-transformer.
 *
 * Usage:
 *   import LoginTopImage from '../assets/images/login_top.svg';
 *   <LoginTopImage width={300} height={200} />
 */
declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}
