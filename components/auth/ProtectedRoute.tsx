import { useClient } from '@/context/ClientContext';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, Text } from 'react-native';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireInvestor?: boolean;
}

export function ProtectedRoute({ children, requireInvestor = false }: ProtectedRouteProps) {
  const { isInvestor, isNonInvestor, loading } = useClient();
  const router = useRouter();

  useEffect(() => {
    if (!loading && requireInvestor && !isInvestor) {
      // Non-investor trying to access investor-only route
      router.replace('/(investor)/about/strategy-snapshot');
    }
  }, [loading, requireInvestor, isInvestor, router]);

  if (loading) {
    return <View className="flex-1 bg-background" />;
  }

  if (requireInvestor && !isInvestor) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-6">
        <Text className="text-lg font-semibold text-foreground mb-2">
          Access Restricted
        </Text>
        <Text className="text-sm text-muted-foreground text-center">
          This page is only accessible to investors.
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}
