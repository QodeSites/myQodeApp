
import React, { useEffect } from "react";
import {
    Modal,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// === Expo Video Imports ===
import { useVideoPlayer, VideoView } from "expo-video";


export default function VideoModal({
    isOpen,
    onClose,
    videoUrl,
    title,
  }: {
    isOpen: boolean;
    onClose: () => void;
    videoUrl: string;
    title: string;
  }) {
    // expo-video: init player with the video source
    const player = useVideoPlayer(videoUrl, (player) => {
      player.loop = false;
      player.play();
    });
  
    useEffect(() => {
      if (!isOpen) {
        // Pause when modal closes
        player.pause();
      } else if (videoUrl) {
        // Play when modal opens with valid URL
        player.play();
      }
    }, [isOpen, videoUrl, player]);
  
    if (!isOpen) return null;
  
    const hasValidUrl = videoUrl && !!videoUrl.trim();
  
    return (
      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View className="flex-1 bg-black/70 justify-center items-center p-4">
          <View className="bg-white rounded-xl w-full max-w-2xl shadow-2xl">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-primary-200">
              <Text className="text-lg font-semibold text-primary-900 flex-1">{title}</Text>
              <TouchableOpacity
                onPress={onClose}
                accessibilityLabel="Close modal"
                className="p-1"
              >
                <Text className="text-3xl text-primary-400">×</Text>
              </TouchableOpacity>
            </View>
            
            {/* Video Container */}
            <View className="p-4 items-center w-full">
              {hasValidUrl ? (
                <View className="w-full max-w-xl bg-black rounded-lg overflow-hidden" style={{ aspectRatio: 16/9 }}>
                  <VideoView
                    player={player}
                    style={{ width: "100%", height: "100%" }}
                    nativeControls={true}
                    contentFit="contain"
                  />
                </View>
              ) : (
                <View className="w-full max-w-xl bg-primary-200 rounded-lg justify-center items-center" style={{ aspectRatio: 16/9 }}>
                  <Text className="text-base text-primary-600 px-4 text-center">
                    Video URL not found.
                  </Text>
                </View>
              )}
              <Text className="text-xs text-primary-600 mt-3 text-center">
                Use the video controls to adjust playback speed and settings.
              </Text>
            </View>
            
            {/* Modal Footer */}
            <View className="flex-row justify-end p-4 border-t border-primary-200 bg-primary-50 rounded-b-xl">
              <TouchableOpacity
                onPress={onClose}
                className="px-4 py-2 bg-white border border-primary-300 rounded-md"
              >
                <Text className="text-sm font-medium text-primary-700">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
}