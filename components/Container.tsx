import React from 'react';
import { ScrollView } from 'react-native';
import Animated, { FadeInDown } from "react-native-reanimated";

interface ContainerProps {
  className?: string;
}

export const Container = ({ children, className = '' }: React.PropsWithChildren<ContainerProps>) => {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
      className={`w-content bg-transparent px-4 py-4 ${className}`}
    >
      <Animated.View
        entering={FadeInDown.duration(260)}
        style={{ flex: 1 }}
      >
        {children}
      </Animated.View>
    </ScrollView>
  );
};
