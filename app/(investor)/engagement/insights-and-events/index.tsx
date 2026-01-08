import { api } from "@/api/axios";
import { Container } from "@/components/Container";
import ModalComponent from "@/components/modal";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Pressable,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import Pdf from "react-native-pdf";
/* ---------------------------------------------
   Section Bar
--------------------------------------------- */
function SectionBar({ title }: { title: string }) {
  return (
    <View className="mt-6 mb-3 rounded-sm bg-primary px-3 py-2 items-center">
      <Text className="text-sm font-semibold tracking-wide text-white">
        {title}
      </Text>
    </View>
  );
}

/* ---------------------------------------------
   Thumbnail Card
--------------------------------------------- */
function ThumbCard({
  title,
  url,
  onPress,
}: {
  title: string;
  url?: string;
  onPress?: () => void;
}) {
  const [previewError, setPreviewError] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      className="w-72 rounded-sm border border-border bg-secondary p-3"
    >
      <View className="mb-2 h-60 w-full overflow-hidden rounded-sm border bg-white">
        {url && !previewError ? (
          <Pdf
            source={{ uri: url, cache: false }}
            trustAllCerts={false}
            enablePaging={true}
            style={{ flex: 1 }}
            renderActivityIndicator={() => <ActivityIndicator />}
            onError={(e) => {
                console.log("Preview PDF error:", e);
                setPreviewError(true);
            }}
            />
        
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-xs text-gray-500">No preview</Text>
          </View>
        )}
      </View>

      <Text className="text-xs font-medium text-gray-600">{title}</Text>
      <Text className="mt-1 text-xs text-blue-600">PDF</Text>
    </Pressable>
  );
}

/* ---------------------------------------------
   Horizontal Slider
--------------------------------------------- */
function Slider({
  items,
  onItemPress,
  sectionId,
}: {
  items: Array<{ title: string; url: string }>;
  onItemPress: (index: number) => void;
  sectionId: string;
}) {
  const scrollRef = useRef<ScrollView>(null);
  let scrollIndex = 0;

  const scroll = (dir: "left" | "right") => {
    scrollIndex =
      dir === "left"
        ? Math.max(0, scrollIndex - 1)
        : Math.min(items.length - 1, scrollIndex + 1);

    scrollRef.current?.scrollTo({
      x: scrollIndex * 290,
      animated: true,
    });
  };

  return (
    <View className="relative">
      <TouchableOpacity
        onPress={() => scroll("left")}
        className="absolute left-0 top-1/2 z-10 rounded-full bg-white p-2"
      >
        <ChevronLeft size={20} />
      </TouchableOpacity>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-12 py-2"
      >
        <View className="flex flex-row gap-2">
        {items.map((item, index) => (
          <ThumbCard
            key={`${sectionId}-${index}`}
            title={item.title}
            url={item.url}
            onPress={() => onItemPress(index)}
          />
        ))}
        </View>
        
      </ScrollView>

      <TouchableOpacity
        onPress={() => scroll("right")}
        className="absolute right-0 top-1/2 z-10 rounded-full bg-white p-2"
      >
        <ChevronRight size={20} />
      </TouchableOpacity>
    </View>
  );
}

/* ---------------------------------------------
   Modal PDF Viewer
--------------------------------------------- */


import { Button } from "@/components/ui/button";
import * as Linking from "expo-linking";

function ContentModal({
  visible,
  onClose,
  items,
  index,
  setIndex,
}: {
  visible: boolean;
  onClose: () => void;
  items: Array<{ title: string; url: string }>;
  index: number;
  setIndex: (i: number) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const screenWidth = Dimensions.get("window").width * 0.9;

  if (!visible) return null;
  const item = items[index];

  const handleDownload = () => {
    // For web, this will open in a new tab, for mobile will prompt browser
    Linking.openURL(item.url);
  };

  return (
    <ModalComponent
      isOpen={visible}
      onClose={onClose}
      title={item.title}
      contentClassName="flex-1 m-0 mx-4 my-12 bg-white rounded-lg overflow-hidden"
      headerClassName="flex-row items-center justify-between border-b p-3"
      bodyClassName={`flex-1 flex-col justify-between p-0`}
    >
      {/* Content */}
      <View className="flex-1">
        {error ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-red-600 text-sm">
              Failed to load PDF
            </Text>
            <Text className="mt-1 text-xs text-gray-500">{error}</Text>
          </View>
        ) : (
          <Pdf
            source={{ uri: item.url, cache: false }}
            trustAllCerts={false}
            enablePaging={true}
            style={{ flex: 1, width: screenWidth }}
            renderActivityIndicator={() => <ActivityIndicator />}
            onError={(e) => {
              console.log("Modal PDF error:", e);
              setError(String(e));
            }}
          />
        )}
      </View>
      {/* Footer navigation + Download Button */}
      <View className="flex-row justify-between items-center p-3 border-t">
        <TouchableOpacity
          disabled={items.length <= 1}
          onPress={() =>
            setIndex(index === 0 ? items.length - 1 : index - 1)
          }
        >
          <ChevronLeft size={20} />
        </TouchableOpacity>
        <Button
          onPress={handleDownload}
          variant="outline"
          size="sm"
          className="mx-3"
        >
          Download PDF
        </Button>
        <TouchableOpacity
          disabled={items.length <= 1}
          onPress={() => setIndex((index + 1) % items.length)}
        >
          <ChevronRight size={20} />
        </TouchableOpacity>
      </View>
    </ModalComponent>
  );
}

/* ---------------------------------------------
   Page
--------------------------------------------- */
export default function Page() {
  const [newsletters, setNewsletters] = useState<
    Array<{ title: string; url: string }>
  >([]);
  const [perspectives, setPerspectives] = useState<
    Array<{ title: string; url: string }>
  >([]);

  const [loading, setLoading] = useState(true);
  const [newsletterIndex, setNewsletterIndex] = useState(0);
  const [perspectiveIndex, setPerspectiveIndex] = useState(0);
  const [openNewsletter, setOpenNewsletter] = useState(false);
  const [openPerspective, setOpenPerspective] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/api/list-folder?path=docs/newsletters"),
      api.get("/api/list-folder?path=docs/prespectives"),
    ])
      .then(([n, p]) => {
        setNewsletters(
          n.data.data.map((i: any) => ({
            title: i.section || i.filename,
            url: i.url, // IMPORTANT: keep full presigned URL
          }))
        );
        setPerspectives(
          p.data.data.map((i: any) => ({
            title: i.section || i.filename,
            url: i.url,
          }))
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Container>
      <SectionBar title="Newsletter Archive" />
      {loading ? (
        <Text className="text-center text-gray-500">Loading…</Text>
      ) : (
        <Slider
          items={newsletters}
          sectionId="newsletter"
          onItemPress={(i) => {
            setNewsletterIndex(i);
            setOpenNewsletter(true);
          }}
        />
      )}

      <SectionBar title="Perspective Archive" />
      {loading ? (
        <Text className="text-center text-gray-500">Loading…</Text>
      ) : (
        <Slider
          items={perspectives}
          sectionId="perspective"
          onItemPress={(i) => {
            setPerspectiveIndex(i);
            setOpenPerspective(true);
          }}
        />
      )}

      <ContentModal
        visible={openNewsletter}
        onClose={() => setOpenNewsletter(false)}
        items={newsletters}
        index={newsletterIndex}
        setIndex={setNewsletterIndex}
      />

      <ContentModal
        visible={openPerspective}
        onClose={() => setOpenPerspective(false)}
        items={perspectives}
        index={perspectiveIndex}
        setIndex={setPerspectiveIndex}
      />
    </Container>
  );
}
