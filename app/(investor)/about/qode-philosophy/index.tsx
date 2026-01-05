import { Container } from '@/components/Container';
import { Text, View } from 'react-native';

const SnapShot = [
  { title: 'Who We Are', description: 'Qode is a SEBI-registered Portfolio Management Service (PMS) built on the principle that evidence, not opinion, should drive investment decisions. Founded by seasoned professionals with over a decade of experience in Indian markets, we exist to give investors a disciplined, transparent, and performance-oriented platform for long-term wealth creation.' },
  { title: 'What We Do', description: 'We design and manage differentiated investment strategies that combine the power of quantitative models with the insight of fundamental research. Our range spans ETF-only portfolios, systematic momentum strategies, diversified growth funds, and high-conviction stock picks—offering clients the flexibility to align with their goals and risk appetite.' },
  { title: 'How We Work', description: 'At Qode, every investment decision is guided by data, tested frameworks, and structured review processes. We believe in clarity over complexity: our clients receive concise updates that explain what we hold, why we hold it, and when we make changes. With bank-grade custody, strong operational controls, and a proactive investor support team, we ensure the experience is as robust as the strategy itself.' },
  { title: 'Why It Matters', description: 'Markets are noisy and narratives change quickly. Qode’s approach is designed to cut through that noise. By combining systematic rigor with long-term conviction, we aim to protect portfolios in challenging times while positioning them to capture opportunities that can compound meaningfully over years.' }
];

export default function Page() {
  return (
    <Container className="p-4 rounded-lg bg-card h-fit">
      {SnapShot.map((snap, idx) => (
        <View key={snap.title} className="mb-6">
          <Text className="mb-2 font-serif text-2xl font-semibold text-primary">
            {snap.title}
          </Text>
          <Text className="text-base text-card-foreground">
            {snap.description}
          </Text>
        </View>
      ))}
    </Container>
  );
}