import React from "react";
import { Text, View } from "react-native";

export default function FullscreenLoader({ brand = "Qode", subtitle = "Preparing your portfolio…" }) {
    return (
        <View className="flex-1 justify-center h-full w-full text-center justify-center content-center items-center bg-background/95">
        <View>
            <Text className="font-serif text-4xl font-[600] text-primary" style={{ lineHeight: 48 }}>{brand}</Text>
        </View>
        <Text className="mt-4 text-base text-card-foreground">{subtitle}</Text>
        <View className="mt-6 w-44 h-2 rounded-full bg-primary/10 overflow-hidden">
            <View className="w-1/3 h-full bg-primary/60 animate-pulse" />
        </View>
        </View>
    );
}