import { Container } from '@/components/Container';
import { Image, Text, View } from 'react-native';

// Use require/import (not string URI) for static assets in React Native
const FundManagers = [
  {
    name: 'Rishabh Nahar',
    title: 'Fund Manager',
    photo: require('@/assets/images/fund-manager/Rishabh.jpg'),
    description:
      "Investing, to me, has always been about process. Markets are unpredictable in the short run, but data, when studied carefully, reveals patterns that can guide us with discipline. At Qode, our approach is rooted in systematic models that help us identify opportunities objectively, free from bias or noise. But models alone are not enough — they must be applied with judgment, constant review, and a deep respect for risk. That's why we combine quantitative insights with robust portfolio construction, always seeking to maximize outcomes while protecting against drawdowns. My goal is simple: to give investors confidence that every decision we take is grounded in evidence, tested rigorously, and aligned with the long-term compounding of their wealth.",
  },
  {
    name: 'Gaurav Didwania',
    title: 'Fund Manager',
    photo: require('@/assets/images/fund-manager/Gaurav.jpg'), // Fixed typo: Guarav => Gaurav
    description:
      "Over the last 15+ years in Indian markets, I've seen cycles of euphoria and panic, trends that come and go, and businesses that either endure or fade.\n\nWhat I've learned is that wealth creation doesn't come from chasing momentum alone — it comes from conviction in the right businesses and the patience to stay invested through volatility.\n\nAt Qode, I focus on marrying deep fundamental research with a long-term mindset. We look beyond stock prices to understand management quality, competitive advantage, financial strength, and industry dynamics.\n\nFor me, Qode is about trust and transparency — ensuring our investors not only achieve returns, but also understand the rationale behind every decision. That understanding builds confidence, and confidence is what allows compounding to work its magic.",
  },
];

export default function Page() {
  return (
    <Container className="p-4 w-full rounded-lg bg-card">
      <View className="flex justify-center items-center p-6 mb-2 bg-primary">
        <Text className="font-serif text-2xl text-center text-accent">
          Note from the Fund Manager
        </Text>
      </View>
      {FundManagers.map((manager, idx) => (
        <View key={manager.name} className="flex flex-col gap-1 mb-6">
            <View className='flex flex-col items-center'>
            <Image
                source={manager.photo}
                resizeMode="cover"
                className="rounded-lg h-[350] w-[300]"
            />
            </View>
            
            <View className='flex flex-col mb-2'>
                <Text className="font-serif text-4xl font-semibold text-primary">
                    {manager.name}
                </Text>
                <Text className="text-xl font-normal text-primary">
                    {manager.title}
                </Text>
            </View>
            <Text className="text-base text-card-foreground">
                {manager.description}
            </Text>
        </View>
      ))} 
      <View className="flex flex-col gap-4">
        <View className="flex overflow-hidden flex-col rounded-lg border border-primary">
            <Text className="py-2 font-serif text-2xl text-center border-b bg-primary text-accent border-primary">
                Mission
            </Text>
            <Text className="p-4 text-card-foreground">
                To support investors with data-driven, high-quality investment solutions that deliver superior risk-adjusted returns.
            </Text>
        </View>
        <View className="flex overflow-hidden flex-col rounded-lg border border-primary">
            <Text className="py-2 font-serif text-2xl text-center border-b bg-primary text-accent border-primary">
                Vision
            </Text>
            <Text className="p-4 text-card-foreground">
                To transform investment management with innovation and discipline, creating lasting value for our investors.
            </Text>
        </View>
      </View>
    </Container>
  );
}