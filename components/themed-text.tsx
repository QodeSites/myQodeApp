import { Text, type TextProps } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
  className?: string;
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  className,
  ...rest
}: ThemedTextProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  
  const typeClasses = {
    default: 'text-base leading-6 font-sans',
    defaultSemiBold: 'text-base leading-6 font-semibold font-sans',
    title: 'text-3xl font-bold leading-8 font-serif',
    subtitle: 'text-xl font-bold font-serif',
    link: 'text-base leading-8 text-blue-600 dark:text-blue-400',
  };

  // Check if className contains font-serif to apply PlayfairDisplay font
  const combinedClassName = `${typeClasses[type]} ${className || ''}`;
  const isSerif = combinedClassName.includes('font-serif');
  const isSans = combinedClassName.includes('font-sans') && !isSerif;
  
  // Apply font family via inline style for React Native (takes precedence over className)
  // This ensures fonts work on mobile even if NativeWind font utilities aren't working
  const fontFamilyStyle = isSerif 
    ? { fontFamily: 'PlayfairDisplay' }
    : isSans
    ? { fontFamily: 'Lato' }
    : undefined;

  // Determine text color - prioritize custom colors, then use theme colors
  let textColor: string | undefined;
  if (lightColor || darkColor) {
    textColor = colorScheme === 'dark' ? (darkColor || lightColor) : (lightColor || darkColor);
  } else if (type === 'link') {
    // Link color is handled by className
    textColor = undefined;
  } else {
    // Use theme foreground color for default text
    textColor = theme.foreground;
  }

  const colorStyle = textColor ? { color: textColor } : undefined;

  return (
    <Text
      className={combinedClassName}
      style={[fontFamilyStyle, colorStyle, style]}
      {...rest}
    />
  );
}
