import { View, type ViewProps } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  className?: string;
};

export function ThemedView({ style, lightColor, darkColor, className, ...otherProps }: ThemedViewProps) {
  const colorScheme = useColorScheme();
  
  const customBackgroundStyle = lightColor || darkColor 
    ? { backgroundColor: colorScheme === 'dark' ? (darkColor || lightColor) : (lightColor || darkColor) }
    : undefined;

  return (
    <View 
      className={`bg-background dark:bg-[#0e1512] ${className || ''}`}
      style={[customBackgroundStyle, style]} 
      {...otherProps} 
    />
  );
}
