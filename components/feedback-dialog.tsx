import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { api } from "@/api/axios";
import Textarea from "@/components/text-area";
import { Button } from "@/components/ui/button";
import { useClient } from "@/context/ClientContext";
import { useToast } from "@/hooks/use-toast";
import ModalComponent from "./modal";

// Compact Radio Button
type RadioButtonProps = {
  selected: boolean;
  label: string;
  onPress: () => void;
};
function CompactRadioButton({ selected, label, onPress }: RadioButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center mr-2 py-0.5 px-1 min-h-[32px]"
      hitSlop={10}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <View className={`h-[22px] w-[22px] rounded-full border-2 flex items-center justify-center mr-1.5 bg-white ${selected ? "border-[#02422B] bg-[#e2f2ea]" : "border-[#DABD38]"}`}>
        {selected && <View className="h-[10px] w-[10px] rounded-full bg-[#02422B]" />}
      </View>
      <Text className="text-[16px] text-[#37584F] font-semibold">{label}</Text>
    </TouchableOpacity>
  );
}

// Replaces original Button Group with actual radio buttons in a row
type RadioGroupProps = {
  value: string;
  onValueChange: (v: string) => void;
  options: { value: string; label: string }[];
  horizontal?: boolean;
  style?: any;
};
function CompactRadioGroup({ value, onValueChange, options, horizontal = true, style }: RadioGroupProps) {
  return (
    <View
      className={horizontal ? "flex-row items-center gap-x-2.5" : ""}
      style={style}
    >
      {options.map((option) => (
        <CompactRadioButton
          key={option.value}
          selected={value === option.value}
          label={option.label}
          onPress={() => onValueChange(option.value)}
        />
      ))}
    </View>
  );
}

type LabelProps = {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
  style?: any;
};
function Label({ children, style, className }: LabelProps) {
  return (
    <Text className={`text-[14px] text-[#37584F] font-semibold mb-0 ${className || ""}`} style={style}>
      {children}
    </Text>
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
    const contentType =
      response.headers &&
      (typeof response.headers.get === "function"
        ? response.headers.get("content-type")
        : response.headers["content-type"]);
    if (response.status < 200 || response.status >= 300) {
      const errorBody = response.data;
      console.error("API response not OK:", {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
      });
      throw new Error(`Failed to send email: ${response.status} ${response.statusText}`);
    }
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

  // Radio rating options 1-5 as dots with numbers
  const npsOptions = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) }));

  return (
    <>
      <Button
        onPress={() => setOpen(true)}
        className="bg-primary text-white border border-gray-300 p-2.5 rounded h-content"
        style={{ alignSelf: "flex-start" }}
      >
        <Text className="text-white">{triggerLabel}</Text>
      </Button>
      <ModalComponent
        isOpen={open}
        onClose={() => {
          resetForm();
          setSubmitStatus("idle");
          setOpen(false);
        }}
        title="Share Your Feedback"
        contentClassName="bg-card rounded-lg max-w-md w-full"
        headerClassName="flex flex-row items-center justify-between p-4 border-b border-border"
        bodyClassName="p-2"
      >
       
          <View className="p-1">
            {/* NPS Question */}
            <View className="mb-3">
              <Label>
                How likely are you to recommend Qode? (1-5)
              </Label>
              <CompactRadioGroup
                value={nps}
                onValueChange={setNps}
                options={npsOptions}
                horizontal
                style={{ marginTop: 8 }}
              />
            </View>
            {/* Satisfaction Question */}
            <View className="mb-3">
              <Label>
                Overall satisfaction with Qode? (1-5)
              </Label>
              <CompactRadioGroup
                value={satisfaction}
                onValueChange={setSatisfaction}
                options={npsOptions}
                horizontal
                style={{ marginTop: 8 }}
              />
            </View>
            {/* Clarity Question */}
            <View className="mb-3">
              <Label>
                Clarity/usefulness of portfolio updates & review calls? (1-5)
              </Label>
              <CompactRadioGroup
                value={clarity}
                onValueChange={setClarity}
                options={npsOptions}
                horizontal
                style={{ marginTop: 8 }}
              />
            </View>
            {/* Ease Question */}
            <View className="mb-3">
              <Label>
                Ease of key processes (onboarding, top-ups, withdrawals)? (1-5)
              </Label>
              <CompactRadioGroup
                value={ease}
                onValueChange={setEase}
                options={npsOptions}
                horizontal
                style={{ marginTop: 8 }}
              />
            </View>
            {/* Suggestion Textarea */}
            <View className="mb-3">
              <Label>
                One thing we could do to improve your experience
              </Label>
              <Textarea
                value={improve}
                onChangeText={setImprove}
                placeholder="Your suggestions..."
                className="w-full min-h-[70px] border border-[#E0E0E0] rounded-[7px] p-2.5 mt-1.5 text-[15px] bg-[#fcfcf7] text-top"
                editable={!isSubmitting}
              />
            </View>
            {/* Result Message */}
            {submitStatus === "success" && (
              <View className="bg-[#e6fde8] rounded-[7px] border border-[#52b660] p-2.5 my-2">
                <Text className="text-[#176b3d] text-[14px]">
                  Your feedback has been sent successfully! Thank you for your input.
                </Text>
              </View>
            )}
            {submitStatus === "error" && (
              <View className="bg-[#fdeded] rounded-[7px] border border-[#ff7575] p-2.5 my-2">
                <Text className="text-[#be3939] text-[14px]">
                  Failed to send feedback. Please try again or contact us directly.
                </Text>
              </View>
            )}
          </View>
          {/* Footer Buttons - always visible below scroll for actions */}
          <View className="flex-row justify-end items-center pt-2 px-3 gap-x-4">
            <Button
              onPress={() => {
                resetForm();
                setSubmitStatus("idle");
                setOpen(false);
              }}
              disabled={isSubmitting}
              className="min-w-[90px] ml-1 font-bold"
              style={{
                borderRadius: 7,
                paddingVertical: 10,
                paddingHorizontal: 18,
                opacity: isSubmitting ? 0.5 : 1,
              }}
              variant="secondary"
              size="md"
            >
              Cancel
            </Button>
            <Button
              onPress={onSubmit}
              disabled={isSubmitting || !nps || !satisfaction || !clarity || !ease}
              className="min-w-[90px] ml-1 text-white font-bold"
              style={{
                borderRadius: 7,
                paddingVertical: 10,
                paddingHorizontal: 18,
                opacity: (isSubmitting || !nps || !satisfaction || !clarity || !ease) ? 0.5 : 1,
              }}
              variant="primary"
              size="md"
            >
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </View>
        
      </ModalComponent>
    </>
  );
}
