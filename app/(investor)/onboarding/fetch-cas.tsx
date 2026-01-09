import { Container } from "@/components/Container";
import { api } from "@/api/axios";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";

export default function FetchCASScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { pan, email } = params as { pan: string; email: string };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'choose' | 'fetching' | 'success'>('choose');
  const [registrar, setRegistrar] = useState<'cams' | 'kfintech' | null>(null);

  const handleFetch = async (selectedRegistrar: 'cams' | 'kfintech') => {
    setRegistrar(selectedRegistrar);
    setStep('fetching');
    setLoading(true);
    setError('');

    try {
      // Call backend to fetch CAS from registrar
      const response = await api.post('/api/cas/fetch', {
        pan,
        email,
        registrar: selectedRegistrar,
        // Date range: last 6 months
        fromDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        toDate: new Date().toISOString().split('T')[0]
      });

      if (response.data.success) {
        setStep('success');
        // Wait a moment then navigate to portfolio
        setTimeout(() => {
          router.replace('/(investor)/portfolio/snapshot');
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Failed to fetch portfolio');
      }

    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch CAS. Please try uploading manually.');
      setStep('choose');
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
          {step === 'choose' && (
            <View className="bg-card rounded-xl p-6 shadow-md">
              <View className="mb-6">
                <Text className="text-2xl font-serif font-bold text-primary mb-2">
                  Select Registrar
                </Text>
                <Text className="text-sm text-muted-foreground">
                  Choose your primary registrar to fetch holdings
                </Text>
              </View>

              {/* CAMS Button */}
              <TouchableOpacity
                className="border-2 border-border rounded-lg p-6 mb-4 bg-background"
                onPress={() => handleFetch('cams')}
                disabled={loading}
              >
                <Text className="text-lg font-bold text-foreground mb-2">
                  CAMS (Computer Age Management Services)
                </Text>
                <Text className="text-sm text-muted-foreground">
                  Used by most AMCs including HDFC, ICICI Prudential, SBI, Axis, etc.
                </Text>
              </TouchableOpacity>

              {/* KFintech Button */}
              <TouchableOpacity
                className="border-2 border-border rounded-lg p-6 mb-4 bg-background"
                onPress={() => handleFetch('kfintech')}
                disabled={loading}
              >
                <Text className="text-lg font-bold text-foreground mb-2">
                  KFintech (Karvy Fintech)
                </Text>
                <Text className="text-sm text-muted-foreground">
                  Used by AMCs including Franklin Templeton, Kotak, Sundaram, etc.
                </Text>
              </TouchableOpacity>

              {error && (
                <View className="bg-red-50 border border-red-200 px-4 py-3 rounded-lg mb-4">
                  <Text className="text-red-700 text-sm">{error}</Text>
                  <TouchableOpacity
                    className="mt-2"
                    onPress={() => router.push({
                      pathname: '/(investor)/onboarding/upload-cas',
                      params: { pan, email }
                    })}
                  >
                    <Text className="text-blue-600 text-sm font-medium">
                      Try uploading CAS manually →
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <View className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <Text className="text-xs text-blue-700">
                  💡 Not sure? Most investors have holdings with both. You can try CAMS first, then add KFintech holdings later.
                </Text>
              </View>
            </View>
          )}

          {step === 'fetching' && (
            <View className="bg-card rounded-xl p-8 shadow-md items-center">
              <ActivityIndicator size="large" color="#02422b" />
              <Text className="text-xl font-bold text-foreground mt-6 mb-2">
                Fetching Your Portfolio...
              </Text>
              <Text className="text-sm text-muted-foreground text-center">
                Requesting CAS from {registrar === 'cams' ? 'CAMS' : 'KFintech'}
              </Text>
              <Text className="text-xs text-muted-foreground mt-4 text-center">
                This may take 30-60 seconds
              </Text>
            </View>
          )}

          {step === 'success' && (
            <View className="bg-card rounded-xl p-8 shadow-md items-center">
              <View className="bg-green-100 rounded-full p-4 mb-4">
                <Text className="text-4xl">✓</Text>
              </View>
              <Text className="text-xl font-bold text-foreground mb-2">
                Portfolio Fetched!
              </Text>
              <Text className="text-sm text-muted-foreground text-center">
                Redirecting to your dashboard...
              </Text>
            </View>
          )}
        </Container>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
