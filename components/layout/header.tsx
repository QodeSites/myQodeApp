// components/layout/Header.tsx
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
  title?: string;
  onMenuPress?: () => void;
  sidebarVisible?: boolean;
  setSidebarVisible?: (visible: boolean) => void;
}

export default function Header({
  onMenuPress,
  sidebarVisible,
  setSidebarVisible,
}: HeaderProps) {
  const insets = useSafeAreaInsets();

  const handleMenuPress = () => {
    if (sidebarVisible !== undefined && setSidebarVisible) {
      setSidebarVisible(!sidebarVisible);
    } else if (onMenuPress) {
      onMenuPress();
    }
  };

  return (
    <View
      className="flex-row justify-between items-center px-4 border-b border-black-200 bg-background"
      style={{
        paddingTop: insets.top,
        height: 80 + insets.top, // consistent header height
      }}
    >
      {/* Left: Brand */}
      <View className="flex-row items-center h-full">
        <View
          className="flex flex-row items-end mb-1 font-serif text-4xl font-bold h-content text-primary"
        >
          <Text className="font-serif text-xl font-[600] text-primary" style={{ lineHeight: 34 }}>
            my
          </Text>
          <Text className="font-serif text-4xl font-[600] text-primary" style={{ lineHeight: 48 }}>
            Qode
          </Text>
        </View>
      </View>

      {(onMenuPress || setSidebarVisible) && (
        <Pressable
          onPress={handleMenuPress}
          className="p-2 rounded-lg"
          style={({ pressed }) => ({
            backgroundColor: pressed ? '#f3f4f6' : 'transparent',
          })}
        >
          <Ionicons name="menu" size={28} color="#1e293b" />
        </Pressable>
      )}
    </View>
  );
}
