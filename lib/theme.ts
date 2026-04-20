import { useColorScheme } from 'react-native';

export const Colors = {
  light: {
    background: '#F0F4F8',
    card: '#FFFFFF',
    cardAlt: '#EBF4FF',
    text: '#0F2340',
    subtext: '#4B6080',
    border: '#D1DCE8',
    primary: '#1A3C6E',
    primaryLight: '#2B5FAA',
    accent: '#0284C7',
    success: '#0D7B4E',
    successBg: '#ECFDF5',
    warning: '#B45309',
    warningBg: '#FFFBEB',
    error: '#B91C1C',
    errorBg: '#FEF2F2',
    tabBar: '#FFFFFF',
    tabBarBorder: '#D1DCE8',
    inputBg: '#F8FAFC',
    statusBar: 'dark' as const,
  },
  dark: {
    background: '#0A1628',
    card: '#132240',
    cardAlt: '#0E1C35',
    text: '#E2EAF4',
    subtext: '#7A96B8',
    border: '#1E3355',
    primary: '#4A90D9',
    primaryLight: '#5BA3E8',
    accent: '#38BDF8',
    success: '#34D399',
    successBg: '#022C22',
    warning: '#FBBF24',
    warningBg: '#1C1400',
    error: '#F87171',
    errorBg: '#1C0808',
    tabBar: '#0E1C35',
    tabBarBorder: '#1E3355',
    inputBg: '#0A1628',
    statusBar: 'light' as const,
  },
};

export type ThemeColors = typeof Colors.light;

export function useTheme() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  return { colors, isDark: scheme === 'dark' };
}
