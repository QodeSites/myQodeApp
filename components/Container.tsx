import React from 'react';
import { ScrollView } from 'react-native';

interface ContainerProps {
  className?: string;
}

export const Container = ({ children, className = '' }: React.PropsWithChildren<ContainerProps>) => {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
      className={`w-content bg-card p-4 rounded-lg ${className}`}
    >
      {children}
    </ScrollView>
  );
};
