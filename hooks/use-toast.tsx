// Toast context and hook for React Native with NextWindCSS-styled toasts

import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";

// Toast type
type ToastVariant = "default" | "destructive" | "success" | "info";
type ToastPayload = {
  id?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;
  duration?: number; // ms
};

// Internal toast structure
type InternalToast = {
  id: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  variant: ToastVariant;
  duration: number;
  visible: boolean;
};

type ToastContextType = {
  show: (payload: ToastPayload) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let globalIdCount = 0;

function genId() {
  globalIdCount++;
  return globalIdCount.toString();
}

// NextWindCSS (tailwind-rn) style helpers
function getToastBg(variant: ToastVariant) {
  switch (variant) {
    case "success":
      return "bg-green-600";
    case "destructive":
      return "bg-red-600";
    case "info":
      return "bg-blue-600";
    case "default":
    default:
      return "bg-neutral-900";
  }
}

export const ToastProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [toasts, setToasts] = useState<InternalToast[]>([]);
  const timers = useRef<{[id: string]: NodeJS.Timeout}>({});

  const show = useCallback((payload: ToastPayload) => {
    const id = payload.id || genId();
    // Only allow one at a time
    setToasts((prev) => {
      // Remove any previous
      return [{
        id,
        title: payload.title,
        description: payload.description,
        variant: payload.variant || "default",
        duration: payload.duration ?? 2700,
        visible: true
      }];
    });

    // Remove toast after duration
    if (timers.current[id]) clearTimeout(timers.current[id]);
    timers.current[id] = setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, visible: false } : t
        )
      );
      // Actually remove from array after short fade
      timers.current[`fade-${id}`] = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        delete timers.current[id];
        delete timers.current[`fade-${id}`];
      }, 320) as unknown as NodeJS.Timeout;
    }, payload.duration ?? 2700) as unknown as NodeJS.Timeout;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.map(t => t.id === id ? { ...t, visible: false } : t));
    setTimeout(() => {
      setToasts((prev) => prev.filter(t => t.id !== id));
      if (timers.current[id]) {
        clearTimeout(timers.current[id]);
        delete timers.current[id];
      }
    }, 320);
  }, []);

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      {/* Toast container - position top */}
      <View
        pointerEvents={toasts.length > 0 ? "auto" : "none"}
        className="absolute top-8 left-0 right-0 z-50 px-3"
        style={{ alignItems: "center" }}
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} {...toast} dismiss={() => dismiss(toast.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

// Toast UI component (with animation)
const ToastItem: React.FC<InternalToast & {dismiss: () => void}> = ({
  id, title, description, variant, visible, dismiss
}) => {
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // NextWindCSS styles
  const containerClass = `${getToastBg(variant)} rounded-xl flex-row px-4 py-3 shadow-md w-full max-w-xs items-center`;
  const titleClass = "font-semibold text-white";
  const descClass = "text-sm text-white mt-1";

  return (
    <Animated.View
      style={{
        opacity,
        marginTop: 4,
        marginBottom: 4,
        transform: [{ translateY: visible ? 0 : -10 }],
      }}
      className={containerClass}
    >
      <View className="flex-1">
        <Text className={titleClass}>{title}</Text>
        {description ? <Text className={descClass}>{description}</Text> : null}
      </View>
      <TouchableOpacity onPress={dismiss} className="ml-3 px-2 py-1 rounded-full active:bg-black/10">
        <Text className="text-white text-lg">×</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// useToast hook for easy consumption
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider.");
  return {
    toast: ctx.show,
    dismiss: ctx.dismiss,
  };
}
