import { Container } from "@/components/Container";
import { Text, View } from "react-native";

export default function Page() {
  return (
    <Container>

        <View className="flex gap-2">
            <Text className="flex gap-2 items-center font-serif text-2xl text-foreground">
            Escalation Framework
            </Text>
            <Text className="mb-2 text-lg text-muted-foreground">
            We take every investor query seriously. If something isn't resolved quickly by our Investor Relations team,
            this structured framework ensures clarity and accountability.
            </Text>
        </View>
        <View className="rounded-md border bg-card">
            <View className="divide-y">
            <View className="p-4 border-b">
                <Text className="text-pretty text-xl font-bold text-foreground flex items-center gap-2">
                Level 1 — Investor Relations (IR)
                </Text>
                <Text className="mt-1 text-sm text-muted-foreground">
                <Text className="font-semibold">Role:</Text> Your first point of contact for all queries — from portfolio updates to operational requests.
                </Text>
                <Text className="mt-1 text-sm text-muted-foreground">
                <Text className="font-semibold">Response SLA:</Text> Within 1 business day.
                </Text>
                <Text className="mt-1 text-sm text-muted-foreground">
                <Text className="font-semibold">Contact:</Text> investor.relations@qodeinvest.com · WhatsApp IR Desk
                </Text>
            </View>

            <View className="p-4 border-b">
                <Text className="text-pretty text-xl font-bold text-foreground flex items-center gap-2">
                Level 2 — Compliance Officer
                </Text>
                <Text className="mt-1 text-sm text-muted-foreground">
                <Text className="font-semibold">Role:</Text> If an issue isn't resolved by IR, it's escalated to the Compliance Officer for review and redressal.
                </Text>
                <Text className="mt-1 text-sm text-muted-foreground">
                <Text className="font-semibold">Scope:</Text> Regulatory matters, delayed responses, or unresolved service issues.
                </Text>
                <Text className="mt-1 text-sm text-muted-foreground">
                <Text className="font-semibold">Escalation Timeline:</Text> Within 24 hours of non‑resolution at Level 1.
                </Text>
                <Text className="mt-1 text-sm text-muted-foreground">
                <Text className="font-semibold">Contact:</Text> compliance@qodeinvest.com
                </Text>
            </View>

            <View className="p-4 border-b">
                <Text className="text-pretty text-xl font-bold text-foreground flex items-center gap-2">
                Level 3 — Principal Officer
                </Text>
                <Text className="mt-1 text-sm text-muted-foreground">
                <Text className="font-semibold">Role:</Text> Final level of escalation, handled directly by the Principal Officer.
                </Text>
                <Text className="mt-1 text-sm text-muted-foreground">
                <Text className="font-semibold">Scope:</Text> Persistent grievances or concerns requiring senior oversight.
                </Text>
                <Text className="mt-1 text-sm text-muted-foreground">
                <Text className="font-semibold">Escalation Timeline:</Text> If unresolved at Compliance level within prescribed timeframes.
                </Text>
                <Text className="mt-1 text-sm text-muted-foreground">
                <Text className="font-semibold">Contact:</Text> karan.salecha@qodeinvest.com
                </Text>
            </View>

            <View className="p-4">
                <Text className="text-pretty text-xl font-bold text-foreground flex items-center gap-2">
                Investor Protection
                </Text>
                <Text className="mt-1 text-sm text-muted-foreground">
                All complaints and resolutions are documented and reviewed periodically.
                </Text>
            </View>
            </View>
        </View>
    </Container>
  );
}