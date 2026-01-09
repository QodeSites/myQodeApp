import { Container } from "@/components/Container";
import { useRouter, useLocalSearchParams } from "expo-router";
import { View, Text, TouchableOpacity } from "react-native";
import { Download, Upload } from "lucide-react-native";

export default function CASOptionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { pan, email } = params;

  const handleFetchCAS = () => {
    router.push({
      pathname: '/(investor)/onboarding/fetch-cas',
      params: { pan, email }
    });
  };

  const handleUploadCAS = () => {
    router.push({
      pathname: '/(investor)/onboarding/upload-cas',
      params: { pan, email }
    });
  };

  return (
    <Container className="flex-1 justify-center px-6 py-8">
      <View className="bg-card rounded-xl p-6 shadow-md">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-2xl font-serif font-bold text-primary mb-2">
            Get Your Portfolio
          </Text>
          <Text className="text-sm text-muted-foreground">
            Choose how you'd like to import your holdings
          </Text>
        </View>

        {/* Option 1: Auto-fetch from registrars */}
        <TouchableOpacity
          className="border-2 border-border rounded-lg p-6 mb-4 bg-background"
          onPress={handleFetchCAS}
        >
          <View className="flex-row items-center mb-3">
            <View className="bg-primary/10 rounded-full p-3 mr-4">
              <Download size={24} color="#02422b" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-foreground mb-1">
                Auto-Fetch from CAMS/KFintech
              </Text>
              <Text className="text-xs text-muted-foreground">
                Recommended • Faster
              </Text>
            </View>
          </View>
          <Text className="text-sm text-muted-foreground">
            We'll automatically fetch your mutual fund holdings from CAMS and KFintech using your PAN.
          </Text>
        </TouchableOpacity>

        {/* Option 2: Upload PDF */}
        <TouchableOpacity
          className="border-2 border-border rounded-lg p-6 bg-background"
          onPress={handleUploadCAS}
        >
          <View className="flex-row items-center mb-3">
            <View className="bg-blue-50 rounded-full p-3 mr-4">
              <Upload size={24} color="#3b82f6" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-foreground mb-1">
                Upload CAS PDF
              </Text>
              <Text className="text-xs text-muted-foreground">
                If you already have it
              </Text>
            </View>
          </View>
          <Text className="text-sm text-muted-foreground">
            Upload your Consolidated Account Statement (CAS) PDF from CAMS or KFintech.
          </Text>
        </TouchableOpacity>

        {/* Info */}
        <View className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <Text className="text-xs text-blue-800 font-medium mb-1">
            📊 What is CAS?
          </Text>
          <Text className="text-xs text-blue-700">
            Consolidated Account Statement contains all your mutual fund holdings across different AMCs in one document.
          </Text>
        </View>
      </View>
    </Container>
  );
}
