import { Container } from '@/components/Container';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';

const SECTIONS = [
  {
    title: "Qode All Weather (QAW)™",
    color: "#008455",
    accent: "#001E13",
    description:
      "Qode All Weather (QAW) is a multi-asset portfolio crafted to deliver consistent long-term performance without timing the markets. This robust framework ensures strong probability of outperforming large cap indices over longer horizons.",
    items: ["Large cap Alpha", "Highest Sharpe*", "Smart Asset Mix", "Downside Cushion"],
  },
  {
    title: "Qode Tactical Fund (QTF)™",
    color: "#550e0e",
    accent: "#360404",
    description:
      "Qode Tactical Fund harnesses the power of momentum, systematically allocating to the strongest market trends while avoiding laggards. This allows the strategy to capture upside faster and deliver higher long-term returns.",
    items: ["Momentum Driven", "Tactical Rebalance", "Regime Switch", "Hedge Overlay*"],

  },
  {
    title: "Qode Growth Fund (QGF)™",
    color: "#0b3452",
    accent: "#051E31",
    description:
      "Qode Growth Fund (QGF) is a factor-based small-cap strategy designed to outperform over long periods. The strategy identifies fundamentally strong, high-growth businesses using a disciplined quantitative model.",
    items: ["Quantitative Strategy", "Small cap focused", "Multifactor Model", "Growth Investing"],
    
  },
  {
    title: "Qode Future Horizons (QFH)™",
    color: "#A78C11",
    accent: "#554602",
    description:
      "Qode Future Horizons (QFH) targets high-growth, under-researched small and micro-cap companies with limited institutional coverage. The strategy seeks asymmetric payoffs, accepting higher volatility and drawdowns.",
    items: ["Quantamental", "Multi-bagger", "Concentrated", "Uncharted*"],
   
  },
]

const GLOSSARY = {
  "Highest Sharpe*": "A measure of risk-adjusted returns - higher values indicate better performance per unit of risk taken.",
  "Hedge Overlay*": "Risk management technique using derivatives to protect against adverse market movements while maintaining upside potential.",
  "Uncharted*": "Investing in lesser-known companies with limited analyst coverage, potentially offering undiscovered opportunities."
}

// Updated Pill to use LinearGradient background for Android support
function Pill({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <LinearGradient
      colors={['white', `${color}09`]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderColor: color,
        borderWidth: 2,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 40,
        shadowOpacity: 0.08,
        elevation: 1,
        marginBottom: 0,
      }}
      // Tailwind/utility classes for RNW still present for web compatibility, but visual handled by style above
      className="flex justify-center items-center group relative overflow-hidden rounded-xl px-4 py-3 text-center font-medium text-gray-800 transition-all duration-300 hover:scale-105 hover:shadow-lg backdrop-blur-sm min-h-[3rem]"
    >
      <Text className="relative text-sm leading-tight z-8">{children}</Text>
    </LinearGradient>
  )
}

export default function Page() {
  return (
    <Container className="p-4 w-full rounded-lg bg-card">
      <View className="flex gap-1.5">
        <Text className="flex gap-2 items-center font-serif text-base text-foreground">
          Strategy Snapshot
        </Text>
        <Text className="mb-1.5 text-xs text-muted-foreground">
          Discover Qode's investment strategies and their core pillars designed for different risk profiles and investment horizons.
        </Text>
      </View>

      {SECTIONS.map((strat) => (
        <LinearGradient
          key={strat.title}
          colors={[`${strat.color}`, strat.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            borderRadius: 24,
            padding: 1,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.14,
            shadowRadius: 16,
            elevation: 2,
            marginBottom: 12,
          }}
          className="flex flex-col gap-1 rounded-3xl"
        >
            <View className="flex flex-row gap-[0.1] justify-start items-center mt-3 mb-1.5 ml-2">
              <View
                className="w-5 h-[1.5] rounded-full"
                style={{ backgroundColor: 'white' }}
              />
              <Text className="ml-2 font-serif text-base font-semibold text-white">
                {strat.title}
              </Text>
            </View>
            <View className="px-4 pb-2">
              <Text className="mb-1.5 text-xs text-white">
                {strat.description}
              </Text>
              <View className="flex flex-1 items-center">
                <View className="w-full">
                  <View className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {strat.items.map((label, i) => (
                      <Pill key={`${strat.title}-${i}`} color={strat.color}>
                        {label}
                      </Pill>
                    ))}
                  </View>
                </View>
              </View>
          </View>
        </LinearGradient>
      ))}

      <View className="p-4 bg-gray-50 rounded-xl border">
        <Text className="mb-2 text-base font-semibold text-foreground">Glossary</Text>
        <View className="space-y-2">
          {Object.entries(GLOSSARY).map(([term, definition]) => (
            <View key={term} className="flex flex-col sm:flex-row">
              <Text className="font-medium text-xs text-foreground min-w-[140px]">{term}</Text>
              <Text className="text-xs leading-relaxed text-muted-foreground">{definition}</Text>
            </View>
          ))}
        </View>
      </View>
    </Container>
  );
}