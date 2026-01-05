import { Button } from "@/components/ui/button";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
    Alert,
    Dimensions,
    Image,
    Linking,
    Modal,
    Platform,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type PdfDialogProps = {
  title: string;
  trigger: React.ReactNode;
  pdfSrc?: string;
  imageSrc?: string;
};

function normalizeUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  if (url.startsWith('/')) {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
      return `${window.location.origin}${url}`;
    }
    return url;
  }

  return `/${url}`;
}
function openLink(url: string) {
  const normalizedUrl = normalizeUrl(url);
  Linking.openURL(normalizedUrl).catch((error) => {
    console.error('Failed to open URL:', error);
    Alert.alert(
      "Failed to open PDF",
      `Could not open: ${normalizedUrl}\n\nPlease check if the file exists or try opening it directly.`,
      [{ text: "OK" }]
    );
  });
}

function downloadLink(url: string) {
  const normalizedUrl = normalizeUrl(url);
  Linking.openURL(normalizedUrl).catch((error) => {
    console.error('Failed to download file:', error);
    Alert.alert(
      "Failed to download file",
      `Could not download: ${normalizedUrl}`,
      [{ text: "OK" }]
    );
  });
}

export function PdfDialog({ title, trigger, pdfSrc, imageSrc }: PdfDialogProps) {
  const [visible, setVisible] = React.useState(false);
  const [pdfError, setPdfError] = React.useState(false);
  const [pdfLoading, setPdfLoading] = React.useState(true);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleOpen = useCallback(() => {
    setVisible(true);
    setPdfError(false);
    setPdfLoading(true);
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    setPdfError(false);
    setPdfLoading(true);
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
  }, []);

  const normalizedPdfUrl = useMemo(() => {
    return pdfSrc ? normalizeUrl(pdfSrc) : null;
  }, [pdfSrc]);

  // Reset loading state when URL changes or modal opens
  useEffect(() => {
    if (visible && normalizedPdfUrl) {
      setPdfLoading(true);
      setPdfError(false);

      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }

      // Previews use timeout in case PDF viewer fails
      loadTimeoutRef.current = setTimeout(() => {
        setPdfLoading(false);
      }, 5000);

      return () => {
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current);
          loadTimeoutRef.current = null;
        }
      };
    } else if (!visible) {
      setPdfLoading(true);
      setPdfError(false);
    }
  }, [visible, normalizedPdfUrl]);

  const handleOpenLink = useCallback(() => {
    if (normalizedPdfUrl) {
      openLink(normalizedPdfUrl);
    }
  }, [normalizedPdfUrl]);

  const handleDownload = useCallback(() => {
    if (pdfSrc) {
      downloadLink(pdfSrc);
    } else if (imageSrc) {
      downloadLink(imageSrc);
    }
  }, [pdfSrc, imageSrc]);

  // Clone the trigger element and merge onPress handlers
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

  const modalHeight = useMemo(() => Dimensions.get("window").height * 0.7, []);

  // Detect if on web for showing preview
  const isWeb =
    Platform.OS === "web" || (typeof window !== "undefined" && !!window.document);

  // File type check (simple)
  const isPdfDocument =
    (pdfSrc && (pdfSrc.toLowerCase().endsWith(".pdf") || pdfSrc.startsWith("http"))) ||
    (imageSrc && /\.(jpg|jpeg|png|webp|gif)$/i.test(imageSrc));

  const renderPdfContent = () => {
    // Only show preview on web for PDFs hosted externally
    if (!pdfSrc) return null;

    if (isWeb && normalizedPdfUrl && pdfSrc.toLowerCase().endsWith('.pdf')) {
      // Try to embed PDF via iframe or via Google Docs Viewer if external
      let iframeSrc = normalizedPdfUrl;
      // If it's not same-origin, wrap with Google Docs Viewer to prevent CORS issues
      try {
        const loc =
          typeof window !== "undefined" && window.location
            ? window.location.origin
            : "";
        const isSameOrigin =
          loc && normalizedPdfUrl.startsWith(loc);

        if (!isSameOrigin && normalizedPdfUrl.startsWith("http")) {
          // Google Docs Viewer for public PDF links
          iframeSrc =
            `https://docs.google.com/gview?url=${encodeURIComponent(
              normalizedPdfUrl
            )}&embedded=true`;
        }
      } catch (e) {}

      return (
        <View style={{ width: "100%", height: "100%", position: "relative" }}>
          {pdfError ? (
            <View className="h-full w-full items-center justify-center p-4">
              <Text className="text-sm text-center text-muted-foreground mb-4">
                Failed to load PDF preview
              </Text>
              <Button onPress={handleOpenLink} variant="default" size="sm">
                Open PDF in new tab
              </Button>
            </View>
          ) : (
            <>
              {pdfLoading && (
                <View className="absolute inset-0 items-center justify-center bg-white/80 z-10">
                  <Text className="text-sm text-muted-foreground">
                    Loading PDF...
                  </Text>
                </View>
              )}
              {/* @ts-ignore - iframe is available in React Native Web */}
              <iframe
                src={iframeSrc}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  display: pdfLoading ? "none" : "block",
                  background: "#fff",
                }}
                title={title}
                onLoad={() => setPdfLoading(false)}
                onError={() => {
                  setPdfError(true);
                  setPdfLoading(false);
                }}
              />
            </>
          )}
        </View>
      );
    }

    // For mobile (React Native), or if not a PDF, show fallback
    return (
      <View className="h-full w-full items-center justify-center p-4">
        <Text className="text-sm text-center text-muted-foreground mb-4">
          PDF preview is not supported in this environment.
        </Text>
        <Button onPress={handleOpenLink} variant="default" size="sm">
          Open PDF in new tab
        </Button>
      </View>
    );
  };

  return (
    <View>
      {triggerWithHandler}
      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={handleClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleClose}
          className="flex-1 items-center justify-center bg-black/50"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            className="bg-white rounded-md w-[96vw] max-w-4xl p-6"
          >
            {/* Header */}
            <View className="mb-4">
              <Text className="font-bold text-lg">{title}</Text>
            </View>

            {/* Content */}
            <View
              className="flex items-center justify-center rounded border bg-white w-full mb-4 overflow-hidden"
              style={{ height: modalHeight }}
            >
              {pdfSrc ? (
                renderPdfContent()
              ) : imageSrc ? (
                <Image
                  source={{ uri: imageSrc }}
                  className="w-full h-full"
                  resizeMode="contain"
                  accessibilityLabel={`${title} preview`}
                />
              ) : (
                <View className="h-full w-full items-center justify-center">
                  <Text className="text-sm text-center text-muted-foreground">
                    No preview available
                  </Text>
                </View>
              )}
            </View>

            {/* Actions */}
            <View className="flex flex-row justify-end gap-2 mt-2">
              {pdfSrc && (
                <Button
                  onPress={handleOpenLink}
                  variant="default"
                  size="sm"
                  className="mr-2"
                >
                  Open in new tab
                </Button>
              )}
              {(pdfSrc || imageSrc) && (
                <Button
                  onPress={handleDownload}
                  variant="default"
                  size="sm"
                >
                  Download
                </Button>
              )}
              <Button
                onPress={handleClose}
                variant="outline"
                size="sm"
                className="ml-2"
              >
                Close
              </Button>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
