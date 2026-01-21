import { bootstrapAuth } from "@/api/auth/bootstrapAuth";
import Header from "@/components/layout/header";
import { PremiumTabBar } from "@/components/navigation/premium-tab-bar";
import { Tabs } from "expo-router";
import { Building2, Shield, Sparkles, TrendingUp, UserCircle2 } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { View } from "react-native";

export default function Layout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await bootstrapAuth();
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) {
    return <View className="flex-1 bg-background" />;
  }

  return (
    <Tabs
      screenOptions={{
        header: () => <Header />,
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: "#f6f8fc" },
      }}
      tabBar={(props) => <PremiumTabBar {...props} />}
    >
      <Tabs.Screen
        name="portfolio"
        options={{
          title: "Portfolio",
          tabBarIcon: ({ color, size }) => <TrendingUp color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: "About",
          tabBarIcon: ({ color, size }) => <Building2 color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="experience"
        options={{
          title: "Experience",
          tabBarIcon: ({ color, size }) => <Sparkles color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="engagement"
        options={{
          title: "Engage",
          tabBarIcon: ({ color, size }) => <UserCircle2 color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="trust"
        options={{
          title: "Trust",
          tabBarIcon: ({ color, size }) => <Shield color={color} size={size ?? 22} />,
        }}
      />
    </Tabs>
  );
}
