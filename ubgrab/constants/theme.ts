import { Platform } from 'react-native';

/**
 * Цветовая схема «Степь» для Монгольского доставщика:
 * - небо (синий), степь (тёплые нейтрали), традиционный акцент (терракотовый).
 */
export const Colors = {
  light: {
    text: '#1C1912',
    textSecondary: '#5C5346',
    background: '#F8F6F1',
    surface: '#FFFFFF',
    tint: '#1E5F74',
    accent: '#B54A2E',
    icon: '#5C5346',
    tabIconDefault: '#8B8378',
    tabIconSelected: '#1E5F74',
    border: '#E8E4DC',
    success: '#2D6A4F',
    warning: '#B8860B',
    error: '#B54A2E',
  },
  dark: {
    text: '#F5F2EB',
    textSecondary: '#A39E92',
    background: '#0F1419',
    surface: '#1A2129',
    tint: '#5BA3B8',
    accent: '#D96A4A',
    icon: '#A39E92',
    tabIconDefault: '#6B6560',
    tabIconSelected: '#5BA3B8',
    border: '#2A333D',
    success: '#40916C',
    warning: '#E0B000',
    error: '#D96A4A',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
