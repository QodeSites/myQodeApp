import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';

interface GoogleSignInButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function GoogleSignInButton({ onPress, loading, disabled }: GoogleSignInButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`flex-row items-center justify-center border-2 border-border rounded-lg py-3 bg-white ${
        (disabled || loading) ? 'opacity-50' : ''
      }`}
    >
      {loading ? (
        <ActivityIndicator color="#02422b" />
      ) : (
        <>
          <Feather name="mail" size={20} color="#02422b" />
          <Text className="ml-2 text-foreground font-semibold text-base">
            Continue with Google
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
