import { Container } from '@/components/Container';
import { Button } from "@/components/ui/button";
import { Linking, Text, View } from 'react-native';

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
    description: "We follow a defined liquidity policy to ensure capital is available for hedging and client needs.",
    pdfSrc: "https://myqode.qodeinvest.com/policies/liquidity-rules.pdf",
    dialogTitle: "Liquidity Rules",
  },
  {
    title: "Rebalance Policy",
    description: "All portfolios are rebalanced monthly, realigning holdings to strategy weights to control drift.",
    pdfSrc: "https://myqode.qodeinvest.com/policies/rebalance-policy.pdf",
    dialogTitle: "Rebalance Policy",
  },
  {
    title: "Concentration Limits",
    description: "We impose no sector caps; portfolios are built bottom‑up, with structural gold allocations.",
    pdfSrc: "https://myqode.qodeinvest.com/policies/concentration-limits.pdf",
    dialogTitle: "Concentration Limits",
  },
];

export default function Page() {
  const handleOpenPdf = (url: string) => {
    Linking.openURL(url);
  };

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
                  <Button
                    variant="default"
                    className="text-sm font-medium bg-primary p-2 rounded-lg"
                    onPress={() => handleOpenPdf(p.pdfSrc)}
                  >
                    Click Here
                  </Button>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </Container>
  )
}