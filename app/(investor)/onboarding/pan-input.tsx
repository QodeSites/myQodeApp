import { Container } from "@/components/Container";
import { api } from "@/api/axios";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";

export default function PANInputScreen() {
  const router = useRouter();
  const [pan, setPan] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // PAN validation regex
  const isPanValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async () => {
    if (!isPanValid) {
      setError('Please enter a valid PAN number (e.g., ABCDE1234F)');
      return;
    }

    if (!isEmailValid) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Store PAN and email in user profile
      await api.post('/api/user/update-profile', {
        pan,
        email
      });

      // Navigate to CAS fetch options
      router.push({
        pathname: '/(investor)/onboarding/cas-options',
        params: { pan, email }
      });

    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerClassName="flex-grow">
        <Container className="flex-1 justify-center px-6 py-8">
          <View className="bg-card rounded-xl p-6 shadow-md">
            {/* Header */}
            <View className="mb-6">
              <Text className="text-2xl font-serif font-bold text-primary mb-2">
                Complete Your Profile
              </Text>
              <Text className="text-sm text-muted-foreground">
                We'll use your PAN to fetch your portfolio holdings from registrars
              </Text>
            </View>

            {/* Email Input */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2">
                Email Address
              </Text>
              <TextInput
                className="bg-input border border-border rounded-lg px-4 py-3 text-base text-foreground"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            {/* PAN Input */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2">
                PAN Number
              </Text>
              <TextInput
                className="bg-input border border-border rounded-lg px-4 py-3 text-base text-foreground"
                value={pan}
                onChangeText={(text) => setPan(text.toUpperCase())}
                placeholder="ABCDE1234F"
                maxLength={10}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!loading}
              />
              <Text className="text-xs text-muted-foreground mt-1">
                Format: 5 letters, 4 numbers, 1 letter
              </Text>
            </View>

            {/* Error Message */}
            {error ? (
              <View className="bg-red-50 border border-red-200 px-4 py-3 rounded-lg mb-4">
                <Text className="text-red-700 text-sm text-center">{error}</Text>
              </View>
            ) : null}

            {/* Submit Button */}
            <TouchableOpacity
              className={`bg-primary rounded-lg py-3 items-center ${
                loading || !isPanValid || !isEmailValid ? 'opacity-50' : ''
              }`}
              onPress={handleSubmit}
              disabled={loading || !isPanValid || !isEmailValid}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-base">
                  Continue
                </Text>
              )}
            </TouchableOpacity>

            {/* Info */}
            <View className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <Text className="text-xs text-blue-800 font-medium mb-1">
                🔒 Secure & Private
              </Text>
              <Text className="text-xs text-blue-700">
                Your PAN is encrypted and used only to fetch your portfolio data from CAMS, KFintech, and other registrars.
              </Text>
            </View>
          </View>
        </Container>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
