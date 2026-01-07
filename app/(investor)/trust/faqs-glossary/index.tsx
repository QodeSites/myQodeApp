"use client"

import { Container } from '@/components/Container'
import { Plus, X } from "lucide-react-native"
import { AnimatePresence, MotiView } from "moti"
import React, { useLayoutEffect, useState } from "react"
import { Linking, Text, TouchableOpacity, View } from "react-native"

type QA = { q: string; a: string | React.ReactNode }
type Section = { title: string; items: QA[] }

const sections: Section[] = [
  {
    title: "Top-ups",
    items: [
      {
        q: "Q1. How do I add more funds to my account?",
        a: "You can top-up anytime via Cashfree. Execution happens once funds reflect (T+1).",
      },
      {
        q: "Q2. Can I set up a SIP?",
        a: "Yes, we offer a Systematic Investment Plan option where fixed amounts are invested at set intervals.",
      },
      {
        q: "Q3. Can I set up a Systematic Transfer Plan (STP)?",
        a: "Yes. We offer a Systematic Transfer Plan, where funds can be parked in the Qode Liquid Fund (QLF) and periodically transferred into core strategy portfolios.",
      },
      {
        q: "Q4. How much amount of top-up can an investor do?",
        a: "Top-ups can be made in multiples of ₹1 lakhs, provided the total portfolio value remains above the SEBI-mandated minimum of ₹50 lakhs.",
      },
    ],
  },
  {
    title: "Withdrawals",
    items: [
      {
        q: "Q5. How do I withdraw money from my PMS account?",
        a: "Submit a withdrawal request through our portal. Proceeds are credited to your bank account, typically within T+10 days.",
      },
      {
        q: "Q6. Is there any lock-in period for withdrawals?",
        a: "No lock-in. Withdrawals are processed as per SEBI PMS guidelines. Partial withdrawals must maintain required minimums.",
      },
    ],
  },
  {
    title: "Fees",
    items: [
      {
        q: "Q7. How are fees charged?",
        a: "Management fees are billed quarterly. Performance fees apply annually on the High Watermark principle.",
      },
      {
        q: "Q8. Do fees include GST?",
        a: "Yes, all fees are subject to GST at prevailing rates.",
      },
    ],
  },
  {
    title: "Taxes",
    items: [
      {
        q: "Q9. Will Qode deduct taxes from my account?",
        a: "Qode does not deduct capital gains tax. Investors are responsible for filing taxes; we provide tax packs annually.",
      },
      {
        q: "Q10. What about TDS on referral rewards or other payments?",
        a: "Yes, referral rewards are subject to TDS as per law. Investment returns are not.",
      },
      {
        q: "Q11. Do you do Tax Loss Harvesting?",
        a: "No. We do not undertake tax-loss harvesting within PMS portfolios, as our focus remains on evidence-based, long-term investing.",
      },
      {
        q: "Q12. Will I receive tax statements?",
        a: "Yes. Investors receive annual tax packs, including realized and unrealized gains, dividend records, and other relevant documentation to assist with tax filing.",
      },
    ],
  },
  {
    title: "Minimums & Customization",
    items: [
      {
        q: "Q13. What is the minimum investment required?",
        a: "As per SEBI regulations, the minimum investment for Portfolio Management Services is ₹50 lakhs.",
      },
      {
        q: "Q14. Can I customize my portfolio?",
        a: "No. All clients within a strategy hold the same model portfolio to maintain fairness, transparency, and evidence-driven execution.",
      },
    ],
  },
  {
    title: "Portal Access",
    items: [
      {
        q: "Q15. How do I log in to see my portfolio?",
        a: (
          <Text>
            Log in via{" "}
            <Text
              className="text-[#008455] hover:text-[#006644] underline font-medium"
              onPress={() => Linking.openURL("https://eclientreporting.nuvamaassetservices.com/wealthspectrum/app/loginWith")}
            >
              WealthSpectrum
            </Text>{" "}
            using your registered email id below is the link{" "}
          </Text>
        ),
      },
      {
        q: "Q16. What if I forget my login password?",
        a: "Use the 'Forgot Password' option on WealthSpectrum or contact our IR team for assistance.",
      },
    ],
  },
  {
    title: "Risk & Operations",
    items: [
      {
        q: "Q17. Can my portfolio lose value?",
        a: "All investments carry risk, though Qode's strategies use discipline, diversification, and hedging to manage downside.",
      },
      {
        q: "Q18. How do you manage risk in extreme markets?",
        a: "We follow defined risk controls — hedging policy, drawdown protocols, liquidity rules, and concentration discipline.",
      },
      {
        q: "Q19. Who holds custody of my assets?",
        a: "Assets are held in your demat account with SEBI-registered custodians. Qode manages investments via POA only.",
      },
      {
        q: "Q20. What happens if Qode's systems go down?",
        a: "We follow Business Continuity & Disaster Recovery (BCP/DR) protocols to ensure uninterrupted operations and client access.",
      },
      {
        q: "Q21. Can I switch between strategies?",
        a: "Yes. Clients can request a strategy switch during the monthly rebalance cycle, subject to reallocation guidelines.",
      },
    ],
  },
]

const glossary: { term: string; def: string }[] = [
  {
    term: "XIRR",
    def: "Extended Internal Rate of Return that accounts for cash flows at different times.",
  },
  {
    term: "HWM (High Watermark)",
    def: "The highest NAV reached; ensures performance fees are charged only on gains above that level.",
  },
  { term: "Benchmark", def: "A reference index used to measure portfolio performance." },
  {
    term: "Drawdown",
    def: "The peak-to-trough decline in portfolio value, usually expressed as a percentage.",
  },
  {
    term: "STP (Systematic Transfer Plan)",
    def: "Allows phased transfer of funds from a liquid portfolio into equity strategies.",
  },
  {
    term: "Custodian",
    def: "A SEBI-registered entity that safeguards client funds and securities.",
  },
  {
    term: "Protective Put",
    def: "An options contract used to limit downside risk by providing insurance against large market declines.",
  },
  {
    term: "Rebalancing",
    def: "The process of aligning client portfolios back to the model portfolio to maintain uniformity and discipline.",
  },
  {
    term: "SEBI",
    def: "The Securities and Exchange Board of India — the regulator for securities markets.",
  },
]

// Collapse animation using Moti (framer-motion alternative for react-native)
function Collapse({
  open,
  children,
}: {
  open: boolean
  children: React.ReactNode
}) {
  const [visible, setVisible] = useState(open)
  useLayoutEffect(() => {
    if (open) setVisible(true)
  }, [open])
  return (
    <AnimatePresence>
      {open && (
        <MotiView
          from={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: 'timing', duration: 220 }}
          className="overflow-hidden"
          style={{ overflow: 'hidden' }}
          onDidExit={() => setVisible(false)}
        >
          <View>
            {children}
          </View>
        </MotiView>
      )}
    </AnimatePresence>
  )
}

export default function FAQsGlossaryPage() {
  const [openIdx, setOpenIdx] = useState<Record<string, number | null>>({})
  const toggle = (sec: string, i: number) =>
    setOpenIdx((p) => ({ ...p, [sec]: p[sec] === i ? null : i }))

  return (
    <Container className="p-4 rounded-lg bg-card h-fit">
      <View className="flex gap-2">
        <Text className="flex gap-2 items-center font-serif text-2xl text-foreground">
          FAQs &amp; Glossary
        </Text>
        <Text className="mb-2 text-lg text-muted-foreground">
          Answers to common questions and definitions of terms used in our updates and reports.
        </Text>
      </View>
      <View className="flex gap-2">
        {sections.map((section) => (
          <View key={section.title}>
            <View className="px-1 md:px-0 mb-2">
              <Text
                className="text-pretty text-xl font-serif text-foreground flex flex-wrap items-center gap-2"
                numberOfLines={2}
                style={{ flexWrap: 'wrap' }}
              >
                {section.title}
              </Text>
            </View>
            <View className="grid gap-4 md:grid-cols-2">
              {section.items.map((item, i) => {
                const isOpen = openIdx[section.title] === i
                return (
                  <View
                    key={i}
                    className={`rounded-xl h-fit border bg-card ${isOpen && "border-[#008455]"}`}
                  >
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => toggle(section.title, i)}
                      accessibilityRole="button"
                      accessibilityState={{ expanded: isOpen }}
                      className="w-full p-4 flex flex-row items-center justify-between gap-4 text-left"
                    >
                      <Text
                        className={`font-medium text-md leading-snug ${isOpen && "text-[#008455]"}`}
                        style={{ flexShrink: 1 }}
                      >
                        {item.q}
                      </Text>
                      <View className="rounded-full border size-6 p-4 justify-center items-center text-emerald-700 border-primary-200" style={{ alignItems: "center", justifyContent: "center" }}>
                        {isOpen ? <X className="size-4" /> : <Plus className="size-4" />}
                      </View>
                    </TouchableOpacity>
                    <Collapse open={isOpen}>
                      <View className="px-4 pb-4 -mt-1">
                        {typeof item.a === "string"
                          ? <Text className="text-sm text-muted-foreground">{item.a}</Text>
                          : item.a}
                      </View>
                    </Collapse>
                  </View>
                )
              })}
            </View>
          </View>
        ))}

        <View>
          <View className="px-1 md:px-0 mb-3">
            <Text className="font-semibold text-2xl">Glossary</Text>
          </View>
          <View className="grid gap-4 md:grid-cols-2">
            {glossary.map((g) => (
              <View key={g.term} className="rounded-xl border bg-card p-4">
                <Text className="font-medium">{g.term}</Text>
                <Text className="mt-1 text-sm text-muted-foreground">{g.def}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

    </Container>
  )
}