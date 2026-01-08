import { Container } from "@/components/Container";
import ModalComponent from "@/components/modal";
import { Button } from "@/components/ui/button";
import * as Linking from "expo-linking";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Dimensions, Text, TouchableOpacity, View } from "react-native";
import Pdf from "react-native-pdf";

const policies = [
  {
    title: "Hedging Policy",
    description:
      "We use derivatives prudently to manage downside risk, not for speculation. Protective put options & hedges are employed where appropriate to safeguard portfolios against significant market declines.",
    pdfSrc: "https://myqode.qodeinvest.com/policies/hedging-policy.pdf",
    dialogTitle: "Qode Hedging Policy",
  },
  {
    title: "Liquidity Rules",
    description:
      "We follow a defined liquidity policy to ensure capital is available for hedging and client needs.",
    pdfSrc: "https://myqode.qodeinvest.com/policies/liquidity-rules.pdf",
    dialogTitle: "Liquidity Rules",
  },
  {
    title: "Rebalance Policy",
    description:
      "All portfolios are rebalanced monthly, realigning holdings to strategy weights to control drift.",
    pdfSrc: "https://myqode.qodeinvest.com/policies/rebalance-policy.pdf",
    dialogTitle: "Rebalance Policy",
  },
  {
    title: "Concentration Limits",
    description:
      "We impose no sector caps; portfolios are built bottom‑up, with structural gold allocations.",
    pdfSrc: "https://myqode.qodeinvest.com/policies/concentration-limits.pdf",
    dialogTitle: "Concentration Limits",
  },
];

/**
 * Modal PDF viewer, modeled on insights-and-events/ContentModal.
 */
function PoliciesPDFModal({
  visible,
  onClose,
  policies,
  index,
  setIndex,
}: {
  visible: boolean;
  onClose: () => void;
  policies: typeof policies;
  index: number;
  setIndex: (i: number) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const screenWidth = Dimensions.get("window").width * 0.9;

  if (!visible) return null;
  const item = policies[index];

  const handleDownload = () => {
    Linking.openURL(item.pdfSrc);
  };

  return (
    <ModalComponent
      isOpen={visible}
      onClose={onClose}
      title={item.dialogTitle || item.title}
      contentClassName="flex-1 m-0 mx-4 my-12 bg-white rounded-lg overflow-hidden"
      headerClassName="flex-row items-center justify-between border-b p-3"
      bodyClassName="flex-1 flex-col justify-between p-0"
    >
      {/* Content */}
      <View className="flex-1">
        {error ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-red-600 text-sm">Failed to load PDF</Text>
            <Text className="mt-1 text-xs text-gray-500">{error}</Text>
          </View>
        ) : (
          <Pdf
            source={{ uri: item.pdfSrc, cache: false }}
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
          disabled={policies.length <= 1}
          onPress={() =>
            setIndex(index === 0 ? policies.length - 1 : index - 1)
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
          disabled={policies.length <= 1}
          onPress={() => setIndex((index + 1) % policies.length)}
        >
          <ChevronRight size={20} />
        </TouchableOpacity>
      </View>
    </ModalComponent>
  );
}

export default function Page() {
  const [openModal, setOpenModal] = useState(false);
  const [policyIndex, setPolicyIndex] = useState(0);

  return (
    <Container>
      <View className="flex gap-2">
        <Text className="flex gap-2 items-center font-serif text-2xl text-foreground">
          Policies
        </Text>
        <Text className="mb-2 text-lg text-muted-foreground">
          Key operating policies that guide portfolio construction and risk management.
        </Text>
      </View>
      <View
        aria-labelledby="policies-list"
        className="rounded-md border bg-card"
      >
        <Text className="sr-only" nativeID="policies-list">
          Policies list
        </Text>
        <View>
          {policies.map((p, idx) => (
            <View
              key={p.title}
              className={
                idx !== policies.length - 1 ? "border-b border-border" : ""
              }
            >
              <View className="p-4">
                <View className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
                  <View className="max-w-3xl">
                    <Text className="text-pretty text-xl font-bold text-foreground flex items-center gap-2">
                      {p.title}
                    </Text>
                    <Text className="mt-1 text-sm text-muted-foreground">
                      {p.description}
                    </Text>
                  </View>
                  <Button
                    variant="default"
                    onPress={() => {
                      setPolicyIndex(idx);
                      setOpenModal(true);
                    }}
                    className="mt-2 md:mt-0"
                  >
                    Preview PDF
                  </Button>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
      <PoliciesPDFModal
        visible={openModal}
        onClose={() => setOpenModal(false)}
        policies={policies}
        index={policyIndex}
        setIndex={setPolicyIndex}
      />
    </Container>
  );
}