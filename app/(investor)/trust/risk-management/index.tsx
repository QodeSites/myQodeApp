import { Container } from '@/components/Container';
import { Linking, Pressable, Text, View } from 'react-native';

function getGoogleDocsEmbedUrl(originalUrl: string) {
  // Accepts a full pdfSrc url, returns an embedded Google Docs viewer URL.
  if (!originalUrl) return "";
  return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(originalUrl)}`;
}

const policies = [
  {
    title: "Hedging Policy",
    description:
      "We use derivatives prudently to manage downside risk, not for speculation. Protective put options & hedges are employed where appropriate to safeguard portfolios against significant market declines.",
    pdfSrc: getGoogleDocsEmbedUrl("https://myqode.qodeinvest.com/policies/hedging-policy.pdf"),
    dialogTitle: "Qode Hedging Policy",
  },
  {
    title: "Liquidity Rules",
    description: "We follow a defined liquidity policy to ensure capital is available for hedging and client needs.",
    pdfSrc: getGoogleDocsEmbedUrl("https://myqode.qodeinvest.com/policies/liquidity-rules.pdf"),
    dialogTitle: "Liquidity Rules",
  },
  {
    title: "Rebalance Policy",
    description: "All portfolios are rebalanced monthly, realigning holdings to strategy weights to control drift.",
    pdfSrc: getGoogleDocsEmbedUrl("https://myqode.qodeinvest.com/policies/rebalance-policy.pdf"),
    dialogTitle: "Rebalance Policy",
  },
  {
    title: "Concentration Limits",
    description: "We impose no sector caps; portfolios are built bottom‑up, with structural gold allocations.",
    pdfSrc: getGoogleDocsEmbedUrl("https://myqode.qodeinvest.com/policies/concentration-limits.pdf"),
    dialogTitle: "Concentration Limits",
  },
];

function openPolicy(pdfSrc: string) {
  if (pdfSrc) {
    Linking.openURL(pdfSrc);
  }
}

export default function Page() {
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
      <View aria-labelledby="policies-list" className="rounded-md border bg-card">
        <Text className="sr-only" nativeID="policies-list">
          Policies list
        </Text>
        <View>
          {policies.map((p, idx) => (
            <View
              key={p.title}
              className={
                idx !== policies.length - 1
                  ? "border-b border-border"
                  : ""
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
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => openPolicy(p.pdfSrc)}
                  >
                    <Text
                      className="text-sm font-medium bg-primary p-2 rounded-lg text-white text-center"
                      style={{ overflow: "hidden" }}
                    >
                      Click Here
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </Container>
  )
}