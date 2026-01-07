import { Button } from "@/components/ui/button";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Pdf from "react-native-pdf";

type PdfDialogProps = {
  title: string;
  trigger: React.ReactNode;
  pdfSrc?: string;
  imageSrc?: string;
};

function normalizeUrl(url: string): string {
  if (!url) return "";
  if (/^https?:\/\//.test(url)) {
    return url;
  }
  // React Native PDF requires absolute URLs or file:// protocol for local files.
  if (url.startsWith("file://")) {
    return url;
  }
  if (url.startsWith("/")) {
    // Attempt to use localhost for emulator/dev environment:
    return `https://127.0.0.1${url}`;
  }
  return url;
}

function openLink(url: string) {
  const normalizedUrl = normalizeUrl(url);
  Linking.openURL(normalizedUrl).catch((error) => {
    console.error("Failed to open URL:", error);
    Alert.alert(
      "Failed to open PDF",
      `Could not open: ${normalizedUrl}\n\nPlease check if the file exists or try opening it directly.`,
      [{ text: "OK" }]
    );
  });
}

async function downloadFileWithPicker(url: string) {
  try {
    const normalizedUrl = normalizeUrl(url);
    const fileName = normalizedUrl.split("/").pop()?.split("?")[0] || "file.pdf";
    const fileUri = FileSystem.documentDirectory + fileName;

    Alert.alert("Downloading", "Please wait while the file is being downloaded...");

    const downloadResumable = FileSystem.createDownloadResumable(
      normalizedUrl,
      fileUri
    );

    const result = await downloadResumable.downloadAsync();
    
    if (!result) {
      throw new Error("Download failed");
    }

    const { uri } = result;

    const isSharingAvailable = await Sharing.isAvailableAsync();

    if (isSharingAvailable) {
      await Sharing.shareAsync(uri, {
        mimeType: url.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/*',
        dialogTitle: 'Save File',
        UTI: url.toLowerCase().endsWith('.pdf') ? 'com.adobe.pdf' : 'public.image',
      });
    } else {
      if (Platform.OS === "android" || Platform.OS === "ios") {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        
        if (status === "granted") {
          const asset = await MediaLibrary.createAssetAsync(uri);
          await MediaLibrary.createAlbumAsync("Downloads", asset, false);
          Alert.alert(
            "Download Complete",
            "File has been saved to your Downloads folder.",
            [{ text: "OK" }]
          );
        } else {
          Alert.alert(
            "Download Complete",
            `File saved to: ${uri}\n\nPlease grant storage permission to save to Downloads folder.`,
            [{ text: "OK" }]
          );
        }
      } else {
        Alert.alert(
          "Download Complete",
          `File saved to: ${uri}`,
          [{ text: "OK" }]
        );
      }
    }
  } catch (error) {
    console.error("Failed to download file:", error);
    Alert.alert(
      "Download Failed",
      `Could not download the file. Please try again or open it in your browser.`,
      [{ text: "OK" }]
    );
  }
}

export function PdfDialog({ title, trigger, pdfSrc, imageSrc }: PdfDialogProps) {
  const [visible, setVisible] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [numberOfPages, setNumberOfPages] = useState<number | null>(null);

  const pdfRef = useRef<any>(null);

  const handleOpen = useCallback(() => {
    setVisible(true);
    setPdfError(false);
    setPdfLoading(true);
    setNumberOfPages(null);
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    setPdfError(false);
    setPdfLoading(true);
    setNumberOfPages(null);
  }, []);

  const normalizedPdfUrl = useMemo(() => {
    if (!pdfSrc) return null;
    if (pdfSrc.startsWith("http://") || pdfSrc.startsWith("https://")) {
      return pdfSrc;
    }
    return normalizeUrl(pdfSrc);
  }, [pdfSrc]);

  useEffect(() => {
    if (visible && normalizedPdfUrl) {
      setPdfLoading(true);
      setPdfError(false);
      setNumberOfPages(null);
    } else if (!visible) {
      setPdfLoading(true);
      setPdfError(false);
      setNumberOfPages(null);
    }
  }, [visible, normalizedPdfUrl]);

  const handleOpenLink = useCallback(() => {
    if (normalizedPdfUrl) {
      openLink(normalizedPdfUrl);
    }
  }, [normalizedPdfUrl]);

  const handleDownload = useCallback(() => {
    if (pdfSrc) {
      downloadFileWithPicker(pdfSrc);
    } else if (imageSrc) {
      downloadFileWithPicker(imageSrc);
    }
  }, [pdfSrc, imageSrc]);

  const triggerWithHandler = useMemo(() => {
    if (!React.isValidElement(trigger)) return trigger;
    return React.cloneElement(
      trigger as React.ReactElement<{ onPress?: () => void }>,
      {
        onPress: (e?: any) => {
          const originalOnPress = (
            trigger as React.ReactElement<{ onPress?: () => void }>
          ).props?.onPress;
          if (originalOnPress) {
            originalOnPress();
          }
          handleOpen();
        },
      }
    );
  }, [trigger, handleOpen]);

  const screenDimensions = Dimensions.get("window");
  const modalHeight = screenDimensions.height * 0.85;
  const modalWidth = screenDimensions.width * 0.95;

  const renderPdfContent = () => {
    if (!pdfSrc) return null;

    if (
      normalizedPdfUrl &&
      pdfSrc.toLowerCase().endsWith(".pdf")
    ) {
      return (
        <View className="flex-1 w-full h-full relative">
          {pdfLoading && (
            <View className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text className="text-base text-gray-700 mt-4 font-medium">Loading PDF...</Text>
              <Text className="text-sm text-gray-500 mt-2">Please wait, this may take a moment</Text>
            </View>
          )}
          {pdfError && (
            <View className="absolute inset-0 flex items-center justify-center bg-white z-20 p-6">
              <View className="bg-red-50 rounded-lg p-6 max-w-md">
                <Text className="text-lg font-semibold text-red-900 mb-2 text-center">
                  Preview Unavailable
                </Text>
                <Text className="text-sm text-red-700 mb-6 text-center leading-5">
                  Unable to load PDF preview. You can open it in your browser or download it to view.
                </Text>
                <View className="flex flex-row gap-3 justify-center">
                  <Button onPress={handleOpenLink} variant="default" size="sm" className="flex-1">
                    <Text className="text-white font-medium">Open in Browser</Text>
                  </Button>
                  <Button onPress={handleDownload} variant="outline" size="sm" className="flex-1">
                    <Text className="font-medium">Download</Text>
                  </Button>
                </View>
              </View>
            </View>
          )}
          {!pdfError && (
            <Pdf
              ref={pdfRef}
              source={{ uri: normalizedPdfUrl }}
              style={{ flex: 1, width: "100%", height: "100%" }}
              onLoadComplete={(numberOfPages: number) => {
                setPdfLoading(false);
                setPdfError(false);
                setNumberOfPages(numberOfPages);
              }}
              onError={(error: any) => {
                console.error("PDF error:", error);
                setPdfLoading(false);
                setPdfError(true);
              }}
              onLoadProgress={() => {
                setPdfLoading(true);
              }}
              trustAllCerts={Platform.OS === "android"} // helps with self-signed
              enablePaging={false}
              activityIndicator={
                <ActivityIndicator size="large" color="#3b82f6" />
              }
            />
          )}
        </View>
      );
    }

    return (
      <View className="h-full w-full flex items-center justify-center p-6">
        <View className="bg-gray-50 rounded-lg p-6 max-w-md">
          <Text className="text-base font-medium text-gray-900 mb-3 text-center">
            Preview Not Supported
          </Text>
          <Text className="text-sm text-gray-600 mb-6 text-center leading-5">
            PDF preview is not available in this environment. Please open the file in your browser.
          </Text>
          <Button onPress={handleOpenLink} variant="default" size="sm" className="w-full">
            <Text className="text-white font-medium">Open PDF in Browser</Text>
          </Button>
        </View>
      </View>
    );
  };

  return (
    <View>
      {triggerWithHandler}
      <Modal
        transparent
        visible={visible}
        animationType="slide"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        <View className="flex-1 bg-black/60">
          <TouchableOpacity
            activeOpacity={1}
            onPress={handleClose}
            className="flex-1 items-center justify-center p-4"
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl overflow-hidden"
              style={{ width: modalWidth, maxWidth: 1200, height: modalHeight }}
            >
              {/* Header */}
              <View className="flex flex-row items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                <View className="flex-1 mr-4">
                  <Text className="text-xl font-bold text-gray-900" numberOfLines={1}>
                    {title}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    {pdfSrc ? 'PDF Document' : imageSrc ? 'Image' : 'Preview'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleClose}
                  className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center active:bg-gray-300"
                  activeOpacity={0.7}
                >
                  <Text className="text-gray-600 text-xl font-bold">✕</Text>
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View className="flex-1 bg-gray-100">
                {pdfSrc ? (
                  renderPdfContent()
                ) : imageSrc ? (
                  <ScrollView 
                    className="flex-1"
                    maximumZoomScale={3}
                    minimumZoomScale={1}
                    contentContainerStyle={{ padding: 16 }}
                  >
                    <Image
                      source={{ uri: imageSrc }}
                      className="w-full h-full rounded-lg"
                      resizeMode="contain"
                      accessibilityLabel={`${title} preview`}
                    />
                  </ScrollView>
                ) : (
                  <View className="flex-1 items-center justify-center p-6">
                    <View className="bg-white rounded-lg p-8 shadow-sm">
                      <Text className="text-base font-medium text-gray-900 text-center mb-2">
                        No Preview Available
                      </Text>
                      <Text className="text-sm text-gray-600 text-center">
                        The content cannot be displayed
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Footer Actions */}
              <View className="flex flex-row items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white">
                {(pdfSrc || imageSrc) && (
                  <>
                    <Button
                      onPress={handleDownload}
                      variant="default"
                      size="sm"
                      className="flex-row items-center gap-2"
                    >
                      <Text className="text-white font-semibold">⬇ Download</Text>
                    </Button>
                    {pdfSrc && (
                      <Button
                        onPress={handleOpenLink}
                        variant="outline"
                        size="sm"
                        className="flex-row items-center gap-2"
                      >
                        <Text className="font-semibold">↗ Open in Browser</Text>
                      </Button>
                    )}
                  </>
                )}
                <Button
                  onPress={handleClose}
                  variant="outline"
                  size="sm"
                >
                  <Text className="font-semibold">Close</Text>
                </Button>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}