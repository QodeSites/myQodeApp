import React from "react";
import { Modal, Text, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;         // Wrap/outer content wrapper
  contentClassName?: string;  // Modal box
  headerClassName?: string;   // Header section
  bodyClassName?: string;     // Main content section
};

export default function ModalComponent({
  isOpen,
  onClose,
  title,
  children,
  className,
  contentClassName,
  headerClassName,
  bodyClassName,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className={"flex-1 bg-black/70 justify-center items-center p-4"}>
          <TouchableWithoutFeedback onPress={() => { /* prevents propagation */ }}>
            <View className={contentClassName || "bg-white rounded-xl w-full max-w-2xl shadow-2xl"}>
              {/* Optional Header */}
              {(title || onClose) && (
                <View className={headerClassName || "flex-row items-center justify-between p-4 border-b border-gray-200"}>
                  {title ? (
                    <Text className="text-lg font-semibold text-gray-900 flex-1">{title}</Text>
                  ) : (
                    <View />
                  )}
                  <TouchableOpacity
                    onPress={onClose}
                    accessibilityLabel="Close modal"
                    className="p-1"
                  >
                    <Text className="text-3xl text-gray-400">×</Text>
                  </TouchableOpacity>
                </View>
              )}
              {/* Children/content */}
              <View className={bodyClassName || "p-4"}>{children}</View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
