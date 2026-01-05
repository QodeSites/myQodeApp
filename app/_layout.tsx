// app/_layout.tsx
import { ClientProvider } from "@/context/ClientContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ToastProvider } from "@/hooks/use-toast";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Platform, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "./global.css";

if (Platform.OS === "web") {
  require("nativewind");
}

SplashScreen.preventAutoHideAsync();

function RootLayoutInner() {
  const colorScheme = useColorScheme();

  const [fontsLoaded, fontError] = useFonts({
    Lato: require("@/assets/fonts/Lato-Regular.ttf"),
    PlayfairDisplay: require("@/assets/fonts/PlayfairDisplay-Regular.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // 🔴 CRITICAL FIX: block rendering
  if (!fontsLoaded && !fontError) {
    return <View />;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(investor)" />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ClientProvider>
        <ToastProvider>
          <RootLayoutInner />
        </ToastProvider>
      </ClientProvider>
    </SafeAreaProvider>
  );
}
