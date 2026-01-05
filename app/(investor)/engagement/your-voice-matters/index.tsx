
import { Container } from "@/components/Container"
import { FeedbackDialog } from "@/components/feedback-dialog"
import { TestimonialDialog } from "@/components/testimonial-dialog"
import React from "react"
import { Text, View } from "react-native"

// Wrapper to keep modal within screen for FeedbackDialog using only className for styling
function SafeFeedbackDialog(props: React.ComponentProps<typeof FeedbackDialog>) {
    return (
        <View
            className="max-w-[500px] w-[97%] sm:w-[500px]"
        >
            <FeedbackDialog {...props} />
        </View>
    )
}

export default function FeedbackPage() {
    return (
        <Container className="p-4 rounded-lg bg-card h-fit ">
            {/* Top section: Feedback */}
            <View className="flex flex-col gap-2">
                <Text className="text-xl font-serif">Why Your Feedback Matters</Text>
                <Text>
                    Every portfolio at Qode is built with discipline, but the way we serve you is shaped by listening. Your
                    input tells us what we’re doing right, what we can refine, and how we can make your experience smoother.
                </Text>
                <Text>
                    Whether it’s the clarity of our reports, the ease of a top-up, or the value of review calls, your
                    perspective helps us get better—step by step.
                </Text>
                <View className="">
                    <SafeFeedbackDialog triggerLabel="Feedback Form" />
                </View>
            </View>

            {/* 
                <View className="rounded-md border p-6">
                <Text className="mb-4 font-semibold">Feedback Form Includes:</Text>
                <View className="list-disc space-y-2 pl-6">
                    <Text>• How likely are you to recommend Qode to a friend or colleague? (1 = Very unlikely, 5 = Very likely)</Text>
                    <Text>• Overall satisfaction with your experience so far (1 = Very dissatisfied, 5 = Very satisfied)</Text>
                    <Text>• Clarity and usefulness of portfolio updates and review calls (1 = Not useful, 5 = Extremely useful)</Text>
                    <Text>• Ease of key processes (onboarding, top-ups, withdrawals) (1 = Very difficult, 5 = Very easy)</Text>
                    <Text>• One thing we could do to improve your experience (open text)</Text>
                </View>
                </View>
            */}

            {/* Divider */}
            <View className="h-px bg-border my-2" />

            {/* Testimonials section */}
            <View className="flex flex-col gap-2">
                <Text className="text-xl font-serif">Why Your Experience Matters</Text>
                <Text>
                    Numbers tell part of the story. The other part is how you feel as an investor—your confidence, your peace of
                    mind, and your trust in our process. When you share your journey with Qode, it not only guides us but also
                    inspires future investors to invest with conviction.
                </Text>
                <Text>
                    If you’ve had a positive journey with Qode, we’d love to hear your story. Testimonials may highlight: your
                    onboarding experience, clarity of communication, and confidence in Qode’s investment philosophy.
                </Text>
                <Text>
                    With your consent, selected testimonials may be anonymized and featured in our website, decks, and newsletters
                    to inspire other investors.
                </Text>
                <View className="">
                    <TestimonialDialog triggerLabel="Testimonial" />
                </View>
            </View>
        </Container>
    )
}
