import React, { useEffect, useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";



type ImageFile = {
  name: string;
  url: string;
};

export default function ImageModal({
    isOpen,
    onClose,
    images,
    title,
  }: {
    isOpen: boolean;
    onClose: () => void;
    images: ImageFile[];
    title: string;
  }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
    useEffect(() => {
      if (isOpen) setCurrentImageIndex(0);
    }, [isOpen]);
  
    if (!isOpen || !images || !images.length) return null;
    const currentImage = images[currentImageIndex];
    if (!currentImage) return null;
  
    return (
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View className="flex-1 bg-black/70 justify-center items-center p-4">
          <View className="bg-white rounded-xl w-full max-w-3xl max-h-[80vh] shadow-2xl">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-primary-200">
              <View className="flex-row items-center gap-4 flex-1">
                <Text className="text-lg font-semibold text-primary-900">{title}</Text>
                {images.length > 1 && (
                  <Text className="text-sm text-primary-500">
                    {currentImageIndex + 1} of {images.length}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={onClose}
                accessibilityLabel="Close modal"
                className="p-1"
              >
                <Text className="text-3xl text-primary-400">×</Text>
              </TouchableOpacity>
            </View>
            {/* Image Container */}
            <View className="p-4 items-center justify-center min-h-[300px] relative">
              {images.length > 1 && currentImageIndex > 0 && (
                <TouchableOpacity
                  onPress={() => setCurrentImageIndex((prev) => Math.max(0, prev - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full z-10"
                  accessibilityLabel="Previous image"
                >
                  <Text className="text-white text-2xl">‹</Text>
                </TouchableOpacity>
              )}
              {images.length > 1 && currentImageIndex < images.length - 1 && (
                <TouchableOpacity
                  onPress={() => setCurrentImageIndex((prev) => Math.min(images.length - 1, prev + 1))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full z-10"
                  accessibilityLabel="Next image"
                >
                  <Text className="text-white text-2xl">›</Text>
                </TouchableOpacity>
              )}
              <Image
                source={{ uri: currentImage.url }}
                className="w-full h-[300px] rounded-lg"
                resizeMode="contain"
              />
            </View>
            {images.length > 1 && (
              <View className="border-t border-primary-200 p-4">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {images.map((image, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setCurrentImageIndex(index)}
                      className={`w-16 h-16 rounded border-2 overflow-hidden mr-2 ${
                        index === currentImageIndex ? "border-blue-600" : "border-primary-200"
                      }`}
                    >
                      <Image
                        source={{ uri: image.url }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            <View className="flex-row justify-between items-center p-4 border-t border-primary-200 bg-primary-50 rounded-b-xl">
              <Text className="text-sm text-primary-600 flex-1" numberOfLines={1}>
                {currentImage.name}
              </Text>
              <TouchableOpacity
                onPress={onClose}
                className="px-4 py-2 bg-white border border-primary-300 rounded-md ml-2"
              >
                <Text className="text-sm font-medium text-primary-700">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }
  