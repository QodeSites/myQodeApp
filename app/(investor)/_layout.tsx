import { bootstrapAuth } from "@/api/auth/bootstrapAuth";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Slot } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Platform,
  Pressable,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SIDEBAR_WIDTH_RATIO = 0.8;
const ANIMATION_DURATION = 300;

export default function Layout() {
  // ✅ MUST NOT BE ASYNC
  const [ready, setReady] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const insets = useSafeAreaInsets();
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get("window");
    return { width, height };
  });
  
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });
    return () => subscription?.remove();
  }, []);
  
  const screenWidth = dimensions.width;
  const screenHeight = dimensions.height;
  const sidebarWidth = screenWidth * SIDEBAR_WIDTH_RATIO;

  const slideAnim = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Debug animation values
  useEffect(() => {
    if (sidebarVisible) {
      const slideListener = slideAnim.addListener(({ value }) => {
        // console.log('slideAnim value:', value);
      });
      const opacityListener = backdropOpacity.addListener(({ value }) => {
        // console.log('backdropOpacity value:', value);
      });
      
      return () => {
        slideAnim.removeListener(slideListener);
        backdropOpacity.removeListener(opacityListener);
      };
    }
  }, [sidebarVisible, slideAnim, backdropOpacity]);

  // Auto-start animation when sidebar becomes visible (handles direct setSidebarVisible calls)
  useEffect(() => {
    if (sidebarVisible && sidebarWidth > 0 && screenWidth > 0) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Reset animation values to starting position
      slideAnim.setValue(sidebarWidth);
      backdropOpacity.setValue(0);
      
      // Start animation after a small delay
      timeoutRef.current = setTimeout(() => {
        // console.log('Auto-starting animation, sidebarWidth:', sidebarWidth);
        const anim = Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: ANIMATION_DURATION,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          }),
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: ANIMATION_DURATION,
            useNativeDriver: true,
          }),
        ]);
        
        anim.start((finished) => {
          // console.log('Auto-animation finished:', finished);
          timeoutRef.current = null;
        });
      }, 50);
      
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    }
  }, [sidebarVisible, sidebarWidth, screenWidth, slideAnim, backdropOpacity]);

  // ✅ Async work ONLY inside useEffect
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
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const openSidebar = useCallback(() => {
    if (sidebarWidth <= 0 || screenWidth <= 0) {
      // console.warn('Invalid dimensions, cannot open sidebar:', { sidebarWidth, screenWidth });
      return;
    }
    
    // console.log('Opening sidebar, sidebarWidth:', sidebarWidth, 'screenWidth:', screenWidth);
    // Just set the state - the useEffect will handle the animation
    setSidebarVisible(true);
  }, [sidebarWidth, screenWidth]);

  const closeSidebar = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: sidebarWidth,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSidebarVisible(false);
    });
  }, [slideAnim, backdropOpacity, sidebarWidth]);

  const handleMenuPress = useCallback(() => {
    sidebarVisible ? closeSidebar() : openSidebar();
  }, [sidebarVisible, openSidebar, closeSidebar]);

  if (!ready) {
    return <View className="flex-1 bg-background" />;
  }
  console.log(sidebarVisible)

  return (
    <View className="flex-1 w-full h-full bg-background">
      <View className="flex-1 h-full">
        <Header
          onMenuPress={handleMenuPress}
          sidebarVisible={sidebarVisible}
          setSidebarVisible={setSidebarVisible}
        />

        <View
          className="flex-1 p-4 w-full"
          style={{ paddingBottom: insets.bottom }}
        >
          <Slot />
        </View>
      </View>

      <Modal
        visible={sidebarVisible}
        transparent
        animationType="none"
        onRequestClose={closeSidebar}
        statusBarTranslucent
        hardwareAccelerated
        presentationStyle="overFullScreen"
      >
        <View 
          style={{ 
            flex: 1,
            width: screenWidth, 
            height: screenHeight,
            backgroundColor: 'transparent'
          }}
          pointerEvents="box-none"
        >
          <Animated.View
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: backdropOpacity,
              backgroundColor: 'rgba(0, 0, 0, 0.5)'
            }}
            pointerEvents="auto"
          >
            <Pressable 
              style={{ flex: 1, width: '100%', height: '100%' }} 
              onPress={closeSidebar} 
            />
          </Animated.View>

          <Animated.View
            style={[
              { 
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: sidebarWidth, 
                height: screenHeight,
                backgroundColor: '#ffffff',
                transform: [{ translateX: slideAnim }],
              },
              Platform.OS === "android"
                ? { elevation: 20 }
                : {
                    shadowColor: "#000",
                    shadowOffset: { width: -2, height: 0 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                  },
            ]}
            pointerEvents="auto"
          >
            <Sidebar onClose={closeSidebar} />
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
