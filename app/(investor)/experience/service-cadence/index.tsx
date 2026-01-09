import { Container } from '@/components/Container';
import { BarChart3, CalendarClock, ClipboardCheck, Mail, MessageSquare, ShieldCheck } from "lucide-react-native";
import type React from "react";
import { Text, View } from "react-native";

function SectionHeader({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) {
  return (
    <View className="mb-2">
      <Text className="text-base font-serif text-foreground tracking-wide border-b border-border pb-1.5 mb-1">
        {children}
      </Text>
      {/* {subtitle ? (
        <Text className="text-xs text-muted-foreground mt-0.5">{subtitle}</Text>
      ) : null} */}
    </View>
  );
}

function InfoCard({
  title,
  children,
  icon: Icon,
  highlight,
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string; size?: number }>;
  highlight?: boolean;
}) {
  return (
    <View className={`flex flex-col rounded-lg border border-border p-3 bg-card ${highlight ? "shadow-lg border-primary/70" : ""}`}>
      <View className="mb-2 flex items-center gap-2 flex-row">
        {Icon && (
          <View className={`inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary opacity-50`}>
            <Icon className="h-2 w-2 text-primary" size={16} aria-hidden="true" />
          </View>
        )}
        <Text className="text-base font-serif text-foreground">{title}</Text>
      </View>
      <View className="text-xs leading-relaxed font-sans text-card-foreground space-y-2">
        {children}
      </View>
    </View>
  );
}

const cadence = [
  {
    section: "Monthly Report",
    subtitle: "Concise, consistent updates to keep you in control.",
    description: "Fund-level performance reports help you track your investments every single month.",
    note: "We will send fund-level performance; individual returns may differ.",
    items: [
      {
        title: "Delivered via Email",
        icon: Mail,
        children: (
          <Text>
            <Text className="font-semibold font-sans">How:</Text> Sent directly to your registered email ID.
          </Text>
        ),
      },
      {
        title: "Performance Updates",
        icon: BarChart3,
        children: (
          <Text>
            <Text className="font-semibold font-sans">Content:</Text> Performance summary across all <Text className="font-semibold font-sans text-primary">Qode strategies (QAW, QTF, QGF, QFH)</Text>.
          </Text>
        ),
      },
      {
        title: "Timeline & Purpose",
        icon: CalendarClock,
        children: (
          <>
            <Text><Text className="font-semibold font-sans">Timeline:</Text> Within the first 15 days of the following month.</Text>
            <Text><Text className="font-semibold font-sans">Purpose:</Text> Stay updated without waiting for quarterly or annual reviews. </Text>
          </>
        ),
      }
    ]
  },
  {
    section: "Quarterly Report",
    subtitle: "Compliant & transparent, with deeper regulatory disclosure.",
    description: null,
    items: [
      {
        title: "Regulatory Disclosure",
        icon: ShieldCheck,
        children: (
          <Text>
            <Text className="font-semibold font-sans">Mandated by SEBI:</Text> Shared within 15 days of quarter‑end.
          </Text>
        ),
      },
      {
        title: "What You Receive",
        icon: ClipboardCheck,
        children: (
          <View className="list-disc space-y-1 pl-5">
            <Text>{'\u2022'} Portfolio holdings & transactions</Text>
            <Text>{'\u2022'} Performance vs. benchmark</Text>
            <Text>{'\u2022'} Regulatory disclosures</Text>
          </View>
        ),
      },
      {
        title: "Why It Matters",
        icon: BarChart3,
        highlight: true,
        children: (
          <Text>
            <Text className="font-semibold font-sans">Purpose:</Text> Ensures <Text className="font-semibold font-sans text-primary">full transparency</Text> and keeps you aligned with regulations.
          </Text>
        ),
      }
    ]
  },
  {
    section: "Annual Review",
    subtitle: "One-on-one guidance for your long-term vision.",
    description: null,
    items: [
      {
        title: "One‑on‑One Engagement",
        icon: MessageSquare,
        children: (
          <Text>
            <Text className="font-semibold font-sans">Format:</Text> Review session with your Fund Manager and Investor Relations team.
          </Text>
        ),
      },
      {
        title: "Deep‑Dive Agenda",
        icon: BarChart3,
        children: (
          <View className="list-disc space-y-1 pl-5">
            <Text>{'\u2022'} Annual performance across strategies</Text>
            <Text>{'\u2022'} Risk‑return attribution & positioning</Text>
            <Text>{'\u2022'} Forward outlook & strategic adjustments</Text>
          </View>
        ),
      },
      {
        title: "Cadence & Outcomes",
        icon: CalendarClock,
        children: (
          <>
            <Text><Text className="font-bold">Timeline:</Text> Once every year.</Text>
            <Text><Text className="font-bold">Purpose:</Text> Align long‑term goals, review progress, and set expectations for the year ahead.</Text>
          </>
        ),
      }
    ]
  },
  {
    section: "Response SLA",
    subtitle: "Proactive, reliable support for every client.",
    description: null,
    items: [
      {
        title: "Standard Queries",
        icon: MessageSquare,
        children: (
          <Text><Text className="font-bold">Email / WhatsApp:</Text> Response within 1 business day.</Text>
        ),
      },
      {
        title: "Operational Requests",
        icon: ClipboardCheck,
        children: (
          <Text><Text className="font-bold">Top‑up, withdrawal, KYC:</Text> Acknowledged next day, executed as per regulatory timelines.</Text>
        ),
      },
      {
        title: "Escalations",
        icon: ShieldCheck,
        highlight: true,
        children: (
          <Text><Text className="font-bold">Routing:</Text> Escalated within 24 hours to Compliance if not resolved.</Text>
        ),
      }
    ]
  }
];

export default function Page() {
  return (
    <Container className="p-4 rounded-lg bg-card h-fit">
      <View className="mb-2 flex gap-1">
        <Text className="flex gap-2 items-center font-serif text-base text-primary">
          Reports & Review
        </Text>
        <Text className="text-xs text-muted-foreground">
          Stay consistently informed with structured reports and timely reviews. From monthly updates to annual reviews, everything is designed to keep you aligned with your portfolio and goals.
        </Text>
      </View>

      {cadence.map((section) => (
        <View key={section.section} className="mb-2">
          <SectionHeader subtitle={section.subtitle}>
            {section.section}
          </SectionHeader>
          {/* {section.note && (
            <Text className="italic font-sans text-lg mb-2">{section.note}</Text>
          )} */}
          {/* {section.description && (
            <Text className="mb-1 text-base text-foreground/80">{section.description}</Text>
          )} */}
          <View className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {section.items.map((item, idx) =>
              <InfoCard
                key={item.title}
                title={item.title}
                icon={item.icon}
                highlight={item.highlight}
              >
                {item.children}
              </InfoCard>
            )}
          </View>
        </View>
      ))}

      {/* <View className="mt-2 pt-4 border-t border-border">
        <Text className="font-serif text-lg text-primary mb-2">Need help or clarification?</Text>
        <Text className="text-base text-card-foreground mb-1">
          Our Investor Relations desk is always available at <Text className="underline text-primary">ir@qodecapital.com</Text>. 
        </Text>
        <Text className="text-muted-foreground text-sm">All reports and interactions are structured to empower you with clarity and confidence on your investment journey.</Text>
      </View> */}
    </Container>
  );
}