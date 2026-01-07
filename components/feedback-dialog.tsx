import React, { useState } from "react";
import { Dimensions, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";

import { api } from "@/api/axios";
import Textarea from "@/components/text-area";
import { useClient } from "@/context/ClientContext";
import { useToast } from "@/hooks/use-toast";

// Dummy components to replace non-RN UI imports.
type DialogProps = {
  open: boolean;
  children: React.ReactNode;
};
function Dialog({ open, children }: DialogProps) {
  return <>{children}</>;
}

type DialogContentProps = {
  children: React.ReactNode;
  className?: string;
};
function DialogContent({ children, className }: DialogContentProps) {
  return (
    <View className={className}>
      {children}
    </View>
  );
}

type DialogHeaderProps = {
  children: React.ReactNode;
};
function DialogHeader({ children }: DialogHeaderProps) {
  return <View className="mb-4">{children}</View>;
}

type DialogTitleProps = {
  children: React.ReactNode;
  className?: string;
};
function DialogTitle({ children, className }: DialogTitleProps) {
  return <Text className={className}>{children}</Text>;
}

type DialogTriggerProps = {
  asChild?: boolean;
  children: React.ReactNode;
};
function DialogTrigger({ asChild, children }: DialogTriggerProps) {
  // Should not render anything in React Native. Handled manually.
  return <>{children}</>;
}

type DialogFooterProps = {
  children: React.ReactNode;
};
function DialogFooter({ children }: DialogFooterProps) {
  return <View className="flex flex-row justify-end gap-2 pt-4">{children}</View>;
}

type LabelProps = {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
};
function Label({ children, htmlFor, className }: LabelProps) {
  return (
    <Text className={className}>{children}</Text>
  );
}

type RadioOption = {
  value: string;
  label: string;
}

type RadioGroupProps = {
  value: string;
  onValueChange: (v: string) => void;
  options: RadioOption[];
  className?: string;
};
function RadioGroup({ value, onValueChange, options, className }: RadioGroupProps) {
  return (
    <View className={className}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          className="flex flex-row items-center gap-2 mr-2"
          onPress={() => onValueChange(option.value)}
        >
          <RadioGroupItem selected={value === option.value} />
          <Label>{option.label}</Label>
        </TouchableOpacity>
      ))}
    </View>
  );
}

type RadioGroupItemProps = {
  selected: boolean;
};
function RadioGroupItem({ selected }: RadioGroupItemProps) {
  return (
    <View
      className="w-5 h-5 rounded-full border border-primary-400 items-center justify-center mr-1"
      style={{ backgroundColor: selected ? "#DABD38" : "#FFF" }}
    >
      {selected && (
        <View className="w-3 h-3 rounded-full bg-primary" />
      )}
    </View>
  );
}



type FeedbackDialogProps = {
  triggerLabel?: string;
  nuvamaCode?: string;
  selectedClientId?: string;
};

async function sendEmail(emailData: {
  to: string;
  subject: string;
  html: string;
  from?: string;
  fromName?: string;
  inquiry_type?: string;
  nuvama_code?: string;
  client_id?: string;
  user_email?: string;
  priority?: string;
  [key: string]: any;
}) {
  try {
    const response = await api.post("/api/send-email", emailData);

    // Axios returns data directly in .data
    // Axios response always has status, statusText, headers as properties (headers is object)
    const contentType =
      response.headers &&
      (typeof response.headers.get === "function"
        ? response.headers.get("content-type")
        : response.headers["content-type"]);

    if (response.status < 200 || response.status >= 300) {
      // Axios never has .text(), use .data for the body
      const errorBody = response.data;
      console.error("API response not OK:", {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
      });
      throw new Error(`Failed to send email: ${response.status} ${response.statusText}`);
    }

    // Axios: response.data holds parsed JSON response if appropriate
    if (
      contentType &&
      typeof contentType === "string" &&
      contentType.includes("application/json")
    ) {
      console.log("API response data:", response.data);
      return response.data;
    } else {
      console.warn("API response is not JSON:", response.data);
      return { success: true };
    }
  } catch (error) {
    console.error("Email sending failed:", error);
    throw error;
  }
}

// ==================
// MAIN FEEDBACK DIALOG
// ==================
export function FeedbackDialog({
  triggerLabel = "Open Feedback Form",
}: FeedbackDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const { toast } = useToast();
  const { selectedClientCode, selectedClientId, clients, loading, selectedEmailClient } = useClient();

  // Form state
  const [nps, setNps] = useState<string>("");
  const [satisfaction, setSatisfaction] = useState<string>("");
  const [clarity, setClarity] = useState<string>("");
  const [ease, setEase] = useState<string>("");
  const [improve, setImprove] = useState<string>("");

  const resetForm = () => {
    setNps("");
    setSatisfaction("");
    setClarity("");
    setEase("");
    setImprove("");
  };

  async function onSubmit() {
    // Validate required fields
    if (
      !nps ||
      !satisfaction ||
      !clarity ||
      !ease ||
      !selectedClientCode
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields including Account ID.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");

    const userEmail = selectedEmailClient;

    const formData = {
      nps,
      satisfaction,
      clarity,
      ease,
      improve: improve.trim(),
      nuvamaCode: selectedClientCode,
    };

    // Generate feedback HTML
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
            <h1 style="margin: 0;">Investor Feedback</h1>
          </div>
          <div class="content">
            <p><strong>Request Type:</strong> Feedback Submission</p>
            <p><strong>Submitted via:</strong> myQode Portal</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <div class="info-box">
              <h3 style="margin-top: 0;">Feedback Details:</h3>
              <p><strong>Account ID:</strong> ${formData.nuvamaCode}</p>
              <p><strong>Client ID:</strong> ${selectedClientId}</p>
              <p><strong>User Email:</strong> ${userEmail}</p>
              <p><strong>How likely are you to recommend Qode? (1-5):</strong> ${formData.nps}</p>
              <p><strong>Overall satisfaction with Qode? (1-5):</strong> ${formData.satisfaction}</p>
              <p><strong>Clarity/usefulness of portfolio updates & review calls? (1-5):</strong> ${formData.clarity}</p>
              <p><strong>Ease of key processes (onboarding, top-ups, withdrawals)? (1-5):</strong> ${formData.ease}</p>
              ${formData.improve
                ? `<p><strong>One thing we could do to improve your experience:</strong> ${formData.improve.replace(
                    /\n/g,
                    "<br>"
                  )}</p>`
                : ""}
            </div>
            <p style="margin-top: 20px; font-size: 14px; color: #37584F;">
              This message was sent from the myQode Portal. Please review the feedback.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    sendEmail({
      to: "investor.relations@qodeinvest.com",
      subject: `New Feedback Submission from ${formData.nuvamaCode}`,
      html: emailHtml,
      from: "investor.relations@qodeinvest.com",
      fromName: "Qode Investor Relations",
      inquiry_type: "feedback",
      nuvama_code: formData.nuvamaCode,
      client_id: selectedClientId,
      user_email: userEmail,
      priority: "normal",
      inquirySpecificData: {
        "How likely are you to recommend Qode? (1-5)": formData.nps,
        "Overall satisfaction with Qode? (1-5)": formData.satisfaction,
        "Clarity/usefulness of portfolio updates & review calls? (1-5)": formData.clarity,
        "Ease of key processes (onboarding, top-ups, withdrawals)? (1-5)": formData.ease,
        "One thing we could do to improve your experience": formData.improve,
      },
    })
      .then(() => {
        setSubmitStatus("success");
        toast({
          title: "Thank you!",
          description: "Your feedback has been recorded.",
        });
        resetForm();
        setTimeout(() => {
          setSubmitStatus("idle");
          setOpen(false);
        }, 2000);
      })
      .catch((error) => {
        console.error("Feedback submission error:", error);
        setSubmitStatus("error");
        toast({
          title: "Error",
          description: "Failed to send feedback. Please try again or contact us directly.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }

  // Radios for all four required questions
  const npsOptions = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) }));

  const windowDimensions = Dimensions.get("window");
  const windowHeight = windowDimensions.height;
  const windowWidth = windowDimensions.width;
  const maxDialogHeight = Math.floor(windowHeight * 0.85);
  const maxDialogWidth = Math.min(600, windowWidth - 32); // 600px max or window width minus padding

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        className="bg-primary text-white border border-gray-300 p-2.5 rounded h-content"
        style={{ alignSelf: "flex-start" }}
      >
        <Text className="text-white">{triggerLabel}</Text>
      </TouchableOpacity>
      <Modal
        visible={open}
        onRequestClose={() => setOpen(false)}
        animationType="slide"
        transparent={true}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-40 p-4">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            className="w-full items-center justify-center flex-1"
            style={{ maxHeight: maxDialogHeight }}
          >
            <View
              className="bg-card rounded-xl p-5"
              style={{
                width: maxDialogWidth,
                maxWidth: maxDialogWidth,
                maxHeight: maxDialogHeight,
              }}
            >
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold">Share Your Feedback</DialogTitle>
              </DialogHeader>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                alwaysBounceVertical={false}
                contentContainerStyle={{ paddingBottom: 10 }}
                style={{ maxHeight: maxDialogHeight - 150 }}
                className=""
              >
                {/* NPS Question */}
                <View className="grid gap-2 mb-2">
                  <Label htmlFor="nps">How likely are you to recommend Qode? (1-5)</Label>
                  <RadioGroup
                    value={nps}
                    onValueChange={setNps}
                    options={npsOptions}
                    className="flex gap-4"
                  />
                </View>
                {/* Satisfaction Question */}
                <View className="grid gap-2 mb-2">
                  <Label htmlFor="satisfaction">Overall satisfaction with Qode? (1-5)</Label>
                  <RadioGroup
                    value={satisfaction}
                    onValueChange={setSatisfaction}
                    options={npsOptions}
                    className="flex gap-4"
                  />
                </View>
                {/* Clarity Question */}
                <View className="grid gap-2 mb-2">
                  <Label htmlFor="clarity">Clarity/usefulness of portfolio updates & review calls? (1-5)</Label>
                  <RadioGroup
                    value={clarity}
                    onValueChange={setClarity}
                    options={npsOptions}
                    className="flex gap-4"
                  />
                </View>
                {/* Ease Question */}
                <View className="grid gap-2 mb-2">
                  <Label htmlFor="ease">Ease of key processes (onboarding, top-ups, withdrawals)? (1-5)</Label>
                  <RadioGroup
                    value={ease}
                    onValueChange={setEase}
                    options={npsOptions}
                    className="flex gap-4"
                  />
                </View>
                {/* Suggestion Textarea */}
                <View className="grid gap-2 mb-2">
                  <Label htmlFor="improve">One thing we could do to improve your experience</Label>
                  <Textarea
                    value={improve}
                    onChangeText={setImprove}
                    placeholder="Your suggestions..."
                    
                    className="textarea min-h-[140px] border border-gray-300 rounded-lg p-2 text-top"
                  />
                </View>
                {/* Result Message */}
                {submitStatus === "success" && (
                  <View className="p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm my-2">
                    <Text className="text-green-700">
                      Your feedback has been sent successfully! Thank you for your input.
                    </Text>
                  </View>
                )}
                {submitStatus === "error" && (
                  <View className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm my-2">
                    <Text className="text-red-700">
                      Failed to send feedback. Please try again or contact us directly.
                    </Text>
                  </View>
                )}
              </ScrollView>
              <DialogFooter>
                <TouchableOpacity
                  className="bg-card border border-primary-300 text-primary-900 px-4 py-2 rounded"
                  onPress={() => {
                    resetForm();
                    setSubmitStatus("idle");
                    setOpen(false);
                  }}
                  disabled={isSubmitting}
                >
                  <Text className="text-primary-900">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-primary text-white hover:opacity-90 px-4 py-2 rounded"
                  onPress={onSubmit}
                  disabled={isSubmitting}
                >
                  <Text className="text-white">{isSubmitting ? "Submitting..." : "Submit Feedback"}</Text>
                </TouchableOpacity>
              </DialogFooter>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}