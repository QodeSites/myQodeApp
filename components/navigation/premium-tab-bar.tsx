import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DURATION_MS = 260;
const EASE = Easing.bezier(0.16, 1, 0.3, 1); // premium ease-out

export function PremiumTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const activeIndex = state.index;
  const progress = useSharedValue(activeIndex);
  const [barWidth, setBarWidth] = useState(0);

  // keep indicator in sync
  if (progress.value !== activeIndex) {
    progress.value = withTiming(activeIndex, { duration: DURATION_MS, easing: EASE });
  }

  const routes = state.routes;
  const tabCount = routes.length;

  const indicatorStyle = useAnimatedStyle(() => {
    const tabW = tabCount > 0 ? barWidth / tabCount : 0;
    return {
      transform: [{ translateX: progress.value * tabW }],
      opacity: withTiming(1, { duration: DURATION_MS, easing: EASE }),
    };
  }, [tabCount, barWidth]);

  const containerPaddingBottom = Math.max(10, insets.bottom);

  const labels = useMemo(
    () =>
      routes.map((route) => {
        const options = descriptors[route.key]?.options;
        const label =
          options?.tabBarLabel ??
          options?.title ??
          (typeof route.name === "string" ? route.name : "");
        return typeof label === "string" ? label : route.name;
      }),
    [routes, descriptors]
  );

  return (
    <View
      style={{
        paddingBottom: containerPaddingBottom,
        paddingTop: 10,
        paddingHorizontal: 12,
        backgroundColor: "transparent",
      }}
    >
      <View
        style={{
          backgroundColor: "rgba(255,255,255,0.92)",
          borderRadius: 18,
          borderWidth: 1,
          borderColor: "rgba(15, 23, 42, 0.08)",
          shadowColor: "#0f172a",
          shadowOpacity: 0.08,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: -6 },
          elevation: 10,
          overflow: "hidden",
        }}
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
      >
        {/* Sliding indicator track */}
        <View style={{ height: 3, backgroundColor: "rgba(15, 23, 42, 0.05)" }}>
          <Animated.View
            style={[
              {
                position: "absolute",
                left: 0,
                top: 0,
                height: 3,
                width: tabCount > 0 ? barWidth / tabCount : 0,
                backgroundColor: "rgba(37, 99, 235, 0.95)",
              },
              indicatorStyle,
            ]}
          />
        </View>

        <View style={{ flexDirection: "row" }}>
          {routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = activeIndex === index;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({ type: "tabLongPress", target: route.key });
            };

            const icon = options.tabBarIcon?.({
              focused: isFocused,
              color: isFocused ? "#2563eb" : "rgba(15, 23, 42, 0.55)",
              size: 22,
            });

            return (
              <TabItem
                key={route.key}
                label={labels[index] ?? route.name}
                icon={icon}
                focused={isFocused}
                onPress={onPress}
                onLongPress={onLongPress}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

function TabItem({
  label,
  icon,
  focused,
  onPress,
  onLongPress,
}: {
  label: string;
  icon: React.ReactNode;
  focused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const p = useSharedValue(focused ? 1 : 0);
  if (p.value !== (focused ? 1 : 0)) {
    p.value = withTiming(focused ? 1 : 0, { duration: DURATION_MS, easing: EASE });
  }

  const aStyle = useAnimatedStyle(() => {
    const scale = interpolate(p.value, [0, 1], [1, 1.04]);
    return { transform: [{ scale }] };
  });

  const pillStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(p.value, [0, 1], [0, 1]),
      transform: [{ scaleX: interpolate(p.value, [0, 1], [0.85, 1]) }],
    };
  });

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={{ flex: 1 }}
      hitSlop={10}
    >
      <Animated.View style={[{ alignItems: "center", paddingVertical: 10 }, aStyle]}>
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 6,
              left: 12,
              right: 12,
              bottom: 6,
              backgroundColor: "rgba(37, 99, 235, 0.08)",
              borderRadius: 14,
            },
            pillStyle,
          ]}
        />
        <View style={{ marginBottom: 4 }}>{icon}</View>
        <Text
          style={{
            fontSize: 12,
            fontWeight: focused ? "600" : "500",
            color: focused ? "#0f172a" : "rgba(15, 23, 42, 0.55)",
          }}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

