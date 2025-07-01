import { DefaultTheme } from 'react-native-paper';

const APP_BLUE = '#0F1D3A';
const APP_ORANGE = '#E57200';
const APP_SURFACE = '#1A294B'; 
const APP_WHITE = '#FFFFFF';
const APP_GREY = '#9CA3AF';

const fontConfig = {
  ...DefaultTheme.fonts,
  regular: {
    fontFamily: 'Inter-Regular',
    fontWeight: '400',
  },
  medium: {
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  light: {
    fontFamily: 'Inter-Regular',
    fontWeight: '300',
  },
  thin: {
    fontFamily: 'Inter-Regular',
    fontWeight: '100',
  },
};

export const theme = {
  ...DefaultTheme,
  dark: true,
  roundness: 12,
  colors: {
    ...DefaultTheme.colors,
    primary: APP_ORANGE,
    accent: APP_ORANGE,
    background: APP_BLUE,
    surface: APP_SURFACE,
    text: APP_WHITE,
    onSurface: APP_WHITE, 
    placeholder: APP_GREY,
  },
  // Use your fontConfig here
  fonts: fontConfig,
};