import { Container } from "@/components/Container";
import { api } from "@/api/axios";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from "react-native";
import * as DocumentPicker from 'expo-document-picker';
import { Upload } from "lucide-react-native";

export default function UploadCASScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { pan, email } = params as { pan: string; email: string };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pdfFile, setPdfFile] = useState<any>(null);
  const [pdfPassword, setPdfPassword] = useState('');

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true
      });

      if (result.type === 'success') {
        setPdfFile(result);
        setError('');
      }
    } catch (err) {
      console.error('Error picking document:', err);
      setError('Failed to select file');
    }
  };

  const handleUpload = async () => {
    if (!pdfFile) {
      setError('Please select a PDF file first');
      return;
    }

    if (!pdfPassword) {
      setError('Please enter the PDF password (usually your PAN or DOB)');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('pdf_file', {
        uri: pdfFile.uri,
        type: 'application/pdf',
        name: pdfFile.name || 'cas.pdf'
      } as any);
      formData.append('password', pdfPassword);
      formData.append('pan', pan);

      // Upload and parse CAS
      const response = await api.post('/api/cas/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        Alert.alert(
          'Success!',
          'Your portfolio has been imported successfully',
          [
            {
              text: 'View Portfolio',
              onPress: () => router.replace('/(investor)/portfolio/snapshot')
            }
          ]
        );
      } else {
        throw new Error(response.data.message || 'Failed to parse CAS');
      }

    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to upload CAS. Please check the password and try again.';
      setError(errorMsg);
      Alert.alert('Upload Failed', errorMsg);
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
                Upload CAS PDF
              </Text>
              <Text className="text-sm text-muted-foreground">
                Import your holdings from a CAS PDF file
              </Text>
            </View>

            {/* File Picker */}
            <TouchableOpacity
              className="border-2 border-dashed border-border rounded-lg p-8 mb-4 items-center bg-background"
              onPress={handlePickDocument}
              disabled={loading}
            >
              <View className="bg-primary/10 rounded-full p-4 mb-3">
                <Upload size={32} color="#02422b" />
              </View>
              {pdfFile ? (
                <>
                  <Text className="text-sm font-medium text-foreground mb-1">
                    {pdfFile.name}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {(pdfFile.size / 1024).toFixed(2)} KB
                  </Text>
                  <TouchableOpacity onPress={handlePickDocument} disabled={loading}>
                    <Text className="text-xs text-blue-600 mt-2">
                      Change file
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text className="text-sm font-medium text-foreground mb-1">
                    Tap to select PDF
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    Choose your CAS PDF file
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Password Input */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2">
                PDF Password
              </Text>
              <TextInput
                className="bg-input border border-border rounded-lg px-4 py-3 text-base text-foreground"
                value={pdfPassword}
                onChangeText={setPdfPassword}
                placeholder="Usually your PAN or Date of Birth"
                secureTextEntry={false}
                autoCapitalize="characters"
                editable={!loading}
              />
              <Text className="text-xs text-muted-foreground mt-1">
                Common formats: ABCDE1234F or DDMMYYYY
              </Text>
            </View>

            {/* Error Message */}
            {error ? (
              <View className="bg-red-50 border border-red-200 px-4 py-3 rounded-lg mb-4">
                <Text className="text-red-700 text-sm">{error}</Text>
              </View>
            ) : null}

            {/* Upload Button */}
            <TouchableOpacity
              className={`bg-primary rounded-lg py-3 items-center mb-4 ${
                loading || !pdfFile || !pdfPassword ? 'opacity-50' : ''
              }`}
              onPress={handleUpload}
              disabled={loading || !pdfFile || !pdfPassword}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-base">
                  Upload & Parse CAS
                </Text>
              )}
            </TouchableOpacity>

            {/* Info */}
            <View className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <Text className="text-xs text-blue-800 font-medium mb-2">
                📄 How to get your CAS PDF:
              </Text>
              <Text className="text-xs text-blue-700 mb-1">
                • CAMS: Visit camsonline.com → Request CAS
              </Text>
              <Text className="text-xs text-blue-700">
                • KFintech: Visit kfintech.com → CAS Request
              </Text>
            </View>
          </View>
        </Container>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
