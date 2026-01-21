import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface HeaderProps {
  right?: React.ReactNode;
}

export default function Header({ right }: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingTop: insets.top,
        backgroundColor: "#0b1b3a",
      }}
    >
      <LinearGradient
        colors={["#0b1b3a", "#08122a"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          height: 56,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 2 }}>
          <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: "600" }}>
            my
          </Text>
          <Text style={{ color: "#ffffff", fontSize: 22, fontWeight: "700" }}>
            Qode
          </Text>
        </View>
        <View style={{ minWidth: 32, alignItems: "flex-end" }}>{right}</View>
      </LinearGradient>
      <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.08)" }} />
    </View>
  );
}
