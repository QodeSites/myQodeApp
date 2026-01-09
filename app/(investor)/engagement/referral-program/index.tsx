import { api } from "@/api/axios"
import { Container } from "@/components/Container"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import Modal from "@/components/modal"
import Textarea from "@/components/text-area"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useClient } from "@/context/ClientContext"
import { useToast } from "@/hooks/use-toast"
import React, { useEffect, useState } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native"

function CTA({
  children,
  href = "#",
  ariaLabel = "Refer an Investor",
}: {
  children: React.ReactNode
  href?: string
  ariaLabel?: string
}) {
  // For RN, behave as just a styled View + button
  return (
    <View className="flex justify-center">
      <View
        accessible={true}
        accessibilityLabel={ariaLabel}
        className="min-w-64 items-center justify-center rounded-md border border-border bg-secondary px-8 py-6"
      >
        {children}
      </View>
    </View>
  )
}

async function sendEmail(emailData: {
  to: string
  subject: string
  html: string
  from?: string
  fromName?: string
  inquiry_type?: string
  nuvama_code?: string
  client_id?: string
  user_email?: string
  priority?: string
  [key: string]: any
}) {
  try {
    // The previous code incorrectly assumed api.post returns a fetch Response; but axios returns a different shape.
    const response = await api.post("/api/send-email", emailData, {
      headers: {
        "Content-Type": "application/json"
      }
    });

    // Axios puts data in response.data, and status in response.status
    if (response.status < 200 || response.status >= 300) {
      // Axios always parses data, so response.data should be available
      console.error('API response not OK:', {
        status: response.status,
        statusText: response.statusText,
        body: response.data,
      });
      throw new Error(`Failed to send email: ${response.status} ${response.statusText}`);
    }

    // Try to return data as expected
    return response.data ?? { success: true };
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
}

export default function ReferAnInvestorPage() {
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const { toast } = useToast()
  const { selectedClientCode, selectedClientId, clients, loading, selectedEmailClient } = useClient()

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    description: "",
    nuvamaCode: selectedClientCode || "QAW0001"
  })

  // Reset nuvama code if selection changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      nuvamaCode: selectedClientCode || "QAW0001"
    }))
  }, [selectedClientCode]);

  // Show loading state if context is still loading
  if (loading) {
    return (
      <Container className="p-4 rounded-lg bg-card h-fit">
        <View className="animate-pulse">
          <View className="h-8 bg-gray-300 rounded w-64 mb-2" />
          <View className="h-4 bg-gray-300 rounded w-96" />
        </View>
      </Container>
    )
  }

  // Show message if no accounts available
  if (clients.length === 0) {
    return (
      <Container className="p-4 rounded-lg bg-card h-fit">
        <View className="space-y-2">
          <Text className="text-pretty text-xl font-bold text-foreground">Refer an Investor</Text>
          <Text className="text-sm text-muted-foreground">No client accounts found. Please contact support.</Text>
        </View>
      </Container>
    )
  }

  function handleSubmit() {
    if (!formData.name || !formData.email || !formData.phone || !formData.nuvamaCode) {
      toast({
        title: "Error",
        description: "Please fill in all required fields, including Name, Email, Phone, and Account ID.",
        variant: "destructive",
      })
      return
    }
    setIsSubmitting(true)
    setSubmitStatus("idle")
    const userEmail = selectedEmailClient

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Lato, Arial, sans-serif; line-height: 1.6; color: #002017; background-color: #EFECD3; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #02422B; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
          .content { background: #FFFFFF; padding: 20px; border: 1px solid #37584F; border-radius: 8px; }
          .info-box { background: #EFECD3; padding: 15px; border-left: 4px solid #DABD38; margin: 15px 0; }
          h1 { font-family: 'Playfair Display', Georgia, serif; color: #DABD38; }
          h3 { font-family: 'Playfair Display', Georgia, serif; color: #37584F; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Investor Referral</h1>
          </div>
          <div class="content">
            <p><strong>Request Type:</strong> Referral Submission</p>
            <p><strong>Submitted via:</strong> myQode Portal</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <div class="info-box">
              <h3 style="margin-top: 0;">Referral Details:</h3>
              <p><strong>Account ID:</strong> ${formData.nuvamaCode}</p>
              <p><strong>Client ID:</strong> ${selectedClientId}</p>
              <p><strong>Referring User Email:</strong> ${userEmail}</p>
              <p><strong>Referred investor name:</strong> ${formData.name}</p>
              <p><strong>Referred investor email:</strong> ${formData.email}</p>
              <p><strong>Referred investor phone:</strong> ${formData.phone}</p>
              <p><strong>Description:</strong> ${formData.description}</p>
            </div>
            <p style="margin-top: 20px; font-size: 14px; color: #37584F;">
              This message was sent from the myQode Portal. Please follow up with the referred investor.
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    const emailData = {
      to: "investor.relations@qodeinvest.com",
      subject: `New Investor Referral from ${formData.nuvamaCode}`,
      html: emailHtml,
      from: "investor.relations@qodeinvest.com",
      fromName: "Qode Investor Relations",
      inquiry_type: "investor_referral",
      nuvama_code: formData.nuvamaCode,
      client_id: selectedClientId,
      user_email: userEmail,
      priority: "normal",
      referral_type: "investor_referral",
      referred_investor_name: formData.name,
      referred_investor_email: formData.email,
      referred_investor_phone: formData.phone,
      description: formData.description
    }

    sendEmail(emailData)
      .then(() => {
        setSubmitStatus("success")
        toast({
          title: "Thank you!",
          description: "Your referral has been submitted successfully.",
        })
        setFormData({
          name: "",
          email: "",
          phone: "",
          description: "",
          nuvamaCode: selectedClientCode || "QAW0001"
        })
        setTimeout(() => {
          setSubmitStatus("idle")
          setIsReferralModalOpen(false)
        }, 2000)
      })
      .catch((err) => {
        console.error("Referral submission error:", err)
        setSubmitStatus("error")
        toast({
          title: "Error",
          description: "Failed to send referral. Please try again or contact us directly.",
          variant: "destructive",
        })
      })
      .finally(() => {
        setIsSubmitting(false)
      })
  }

  return (
    <ProtectedRoute requireInvestor>
      <Container className="p-4 rounded-lg bg-card h-fit">
      <KeyboardAvoidingView
        enabled
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
        style={{ flex: 1 }}
      >
        <View
          className="flex gap-2"
        >
            <View className="flex gap-2">
                <Text className="flex gap-2 items-center font-serif text-2xl text-foreground">
                    Refer an Investor
                </Text>
                <Text className="mb-2 text-lg text-muted-foreground">
                    Share the Qode experience. Earn rewards for helping us grow together. At Qode, we value the trust you place in
                    us. If you know someone who would benefit from disciplined, evidence‑based investing, you can refer them to us
                    and earn rewards once their investment begins.
                    {selectedClientCode ? (
                        <Text className="ml-2 text-primary font-medium">
                        {" "}
                        Current Account: {selectedClientCode}
                        </Text>
                    ) : null}
                </Text>
            </View>
          
          <View className="rounded-md border border-border bg-card p-4">
            <Text className="mb-3 text-center text-sm font-bold text-foreground">Program Details</Text>
            <View className="text-sm leading-relaxed text-card-foreground space-y-2">
              <Text>
                <Text className="font-semibold">Reward:</Text> ₹15,000 for every ₹50 lakh of fresh investments referred.
              </Text>
              <Text>
                <Text className="font-semibold">Example:</Text> Referral of ₹1 Cr = ₹30,000 reward.
              </Text>
              <Text>
                <Text className="font-semibold">Eligibility:</Text> Reward applicable once the referred investor's funds are deployed.
              </Text>
              <Text>
                <Text className="font-semibold">Payout Timeline:</Text> Processed within <Text className="font-semibold">30 days</Text> of investment confirmation.
              </Text>
              <Text>
                <Text className="font-semibold">Tax:</Text> Subject to TDS as per applicable law.
              </Text>
            </View>
            <View className="mt-3 flex justify-center">
              <Button
                variant="default"
                size="lg"
                className="flex-1 w-fit"
                onPress={() => setIsReferralModalOpen(true)}
              >
                Submit Referral
              </Button>
            </View>
          </View>

          <Modal
            isOpen={isReferralModalOpen}
            onClose={() => {
              setIsReferralModalOpen(false)
              setFormData({
                name: "",
                email: "",
                phone: "",
                description: "",
                nuvamaCode: selectedClientCode || "QAW0001",
              })
              setSubmitStatus("idle")
            }}
            title="Refer an Investor"
            contentClassName="bg-card rounded-xl w-full max-w-2xl"
          >
            <ScrollView
              className="w-full"
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 10 }}
            >
              <View className="flex gap-2">
                <View>
                  <Text className="block text-sm font-medium text-foreground mb-2">
                    Account ID <Text className="text-destructive">*</Text>
                  </Text>
                  <Select
                    value={formData.nuvamaCode}
                    onValueChange={(val) => setFormData({ ...formData, nuvamaCode: val })}
                    placeholder="Select Account"
                  >
                    <SelectTrigger className="w-full h-12 bg-background border border-border rounded-lg p-2 mb-1">
                      <SelectValue
                        placeholder="Select Account"
                        formatValue={v => {
                          const c = clients.find(cl => cl.clientcode === v)
                          return c ? `${c.clientname} (${c.clientcode})` : v
                        }}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.clientid} value={client.clientcode}>
                          <View className="flex flex-row items-center gap-1">
                            <Text className="text-base">{client.clientname}</Text>
                            <Text className="text-xs text-muted-foreground">({client.clientcode})</Text>
                          </View>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Text className="text-xs text-muted-foreground mt-3">
                    Currently selected: {formData.nuvamaCode}
                  </Text>
                </View>

                {/* Name */}
                <View>
                  <Text className="block text-sm font-medium text-foreground mb-2">
                    Referred investor name <Text className="text-destructive">*</Text>
                  </Text>
                  <TextInput
                    value={formData.name}
                    onChangeText={val => setFormData({ ...formData, name: val })}
                    className="w-full px-3 py-3 border border-border rounded-md bg-background text-foreground text-base"
                    placeholder="Enter full name..."
                    autoCapitalize="words"
                  />
                </View>

                {/* Email */}
                <View>
                  <Text className="block text-sm font-medium text-foreground mb-2">
                    Referred investor email <Text className="text-destructive">*</Text>
                  </Text>
                  <TextInput
                    value={formData.email}
                    onChangeText={val => setFormData({ ...formData, email: val })}
                    className="w-full px-3 py-3 border border-border rounded-md bg-background text-foreground text-base"
                    placeholder="Enter email address..."
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {/* Phone */}
                <View>
                  <Text className="block text-sm font-medium text-foreground mb-2">
                    Referred investor phone <Text className="text-destructive">*</Text>
                  </Text>
                  <TextInput
                    value={formData.phone}
                    onChangeText={val => setFormData({ ...formData, phone: val })}
                    className="w-full px-3 py-3 border border-border rounded-md bg-background text-foreground text-base"
                    placeholder="Enter phone number..."
                    keyboardType="phone-pad"
                  />
                </View>

                {/* Description */}
                <View>
                  <Text className="block text-sm font-medium text-foreground mb-2">
                    Description
                  </Text>
                  <Textarea
                    value={formData.description}
                    onChangeText={val => setFormData({ ...formData, description: val })}
                    className="w-full px-3 py-3 border border-border rounded-md bg-background text-foreground text-base"
                    placeholder="Description"
                    numberOfLines={4}
                  />
                </View>

                {/* Status */}
                {submitStatus === "success" && (
                  <View className="p-3 rounded bg-green-100 border border-green-400">
                    <Text className="text-green-700 text-sm">
                      Your referral has been sent successfully! Thank you for your input.
                    </Text>
                  </View>
                )}
                {submitStatus === "error" && (
                  <View className="p-3 rounded bg-red-100 border border-red-400">
                    <Text className="text-red-700 text-sm">
                      Failed to send referral. Please try again or contact us directly.
                    </Text>
                  </View>
                )}

                <View className="flex flex-row gap-3 justify-end mt-1">
                  <TouchableOpacity
                    onPress={() => {
                      setIsReferralModalOpen(false)
                      setFormData({
                        name: "",
                        email: "",
                        phone: "",
                        description: "",
                        nuvamaCode: selectedClientCode || "QAW0001",
                      })
                      setSubmitStatus("idle")
                    }}
                    disabled={isSubmitting}
                  >
                    <Text className="px-4 py-2 text-sm font-medium text-muted-foreground">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      if (!isSubmitting) handleSubmit()
                    }}
                    disabled={
                      isSubmitting ||
                      !formData.name ||
                      !formData.email ||
                      !formData.phone ||
                      !formData.nuvamaCode
                    }
                    className={`px-4 py-2 bg-primary rounded-md ${isSubmitting || !formData.name || !formData.email || !formData.phone || !formData.nuvamaCode ? "opacity-50" : ""}`}
                  >
                    <Text className="text-sm font-medium text-white">
                      {isSubmitting ? "Submitting..." : "Submit Referral"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </Modal>
        </View>
      </KeyboardAvoidingView>
    </Container>
    </ProtectedRoute>
  )
}
