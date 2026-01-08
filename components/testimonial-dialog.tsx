import React, { useState } from "react";
import { Text, View } from "react-native";

import { api } from "@/api/axios";
import ModalComponent from "@/components/modal";
import Textarea from "@/components/text-area";
import { Button } from "@/components/ui/button";
import { useClient } from "@/context/ClientContext";
import { useToast } from "@/hooks/use-toast";

type Props = {
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

export function TestimonialDialog({
  triggerLabel = "Open Testimonial Form",
}: Props) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const { toast } = useToast();
  const { selectedClientCode, selectedClientId, selectedEmailClient } = useClient();
  const [story, setStory] = useState("");

  const resetForm = () => {
    setStory("");
  };

  async function onSubmit() {
    const formData = {
      story: story.trim(),
      nuvamaCode: selectedClientCode,
    };

    if (!formData.story || !formData.nuvamaCode) {
      toast({
        title: "Error",
        description: "Please provide your testimonial story and Account ID.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");

    const userEmail = selectedEmailClient;

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
            <h1 style="margin: 0;">Investor Testimonial</h1>
          </div>
          <div class="content">
            <p><strong>Request Type:</strong> Testimonial Submission</p>
            <p><strong>Submitted via:</strong> myQode Portal</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <div class="info-box">
              <h3 style="margin-top: 0;">Testimonial Details:</h3>
              <p><strong>Account ID:</strong> ${formData.nuvamaCode}</p>
              <p><strong>Client ID:</strong> ${selectedClientId}</p>
              <p><strong>User Email:</strong> ${userEmail}</p>
              <p><strong>Your testimonial story:</strong> ${formData.story.replace(/\n/g, "<br>")}</p>
            </div>
            <p style="margin-top: 20px; font-size: 14px; color: #37584F;">
              This message was sent from the myQode Portal. Please review the testimonial.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    sendEmail({
      to: "investor.relations@qodeinvest.com",
      subject: `New Testimonial Submission from ${formData.nuvamaCode}`,
      html: emailHtml,
      from: "investor.relations@qodeinvest.com",
      fromName: "Qode Investor Relations",
      inquiry_type: "testimonial",
      nuvama_code: formData.nuvamaCode,
      client_id: selectedClientId,
      user_email: userEmail,
      priority: "normal",
      inquirySpecificData: {
        "Your testimonial story": formData.story,
      },
    })
      .then(() => {
        setSubmitStatus("success");
        toast({
          title: "Thank you!",
          description: "Your testimonial has been received.",
        });
        resetForm();
        setTimeout(() => {
          setSubmitStatus("idle");
          setOpen(false);
        }, 2000);
      })
      .catch((error) => {
        console.error("Testimonial submission error:", error);
        setSubmitStatus("error");
        toast({
          title: "Error",
          description: "Failed to send testimonial. Please try again or contact us directly.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }

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
        title="Share Your Qode Experience"
        contentClassName="bg-card rounded-lg max-w-md w-full"
        headerClassName="flex flex-row items-center justify-between p-4 border-b border-border"
        bodyClassName="p-2"
      >
        <View className="p-1">
          <View className="mb-3">
            <Label>
              Your testimonial story
            </Label>
            <Textarea
              value={story}
              onChangeText={setStory}
              placeholder="Tell us about your journey with Qode..."
              className="w-full min-h-[120px] border border-[#E0E0E0] rounded-[7px] p-2.5 mt-1.5 text-[15px] bg-[#fcfcf7] text-top"
              editable={!isSubmitting}
              textAlignVertical="top"
            />
          </View>
          {submitStatus === "success" && (
            <View className="bg-[#e6fde8] rounded-[7px] border border-[#52b660] p-2.5 my-2">
              <Text className="text-[#176b3d] text-[14px]">
                Your testimonial has been sent successfully! Thank you for your input.
              </Text>
            </View>
          )}
          {submitStatus === "error" && (
            <View className="bg-[#fdeded] rounded-[7px] border border-[#ff7575] p-2.5 my-2">
              <Text className="text-[#be3939] text-[14px]">
                Failed to send testimonial. Please try again or contact us directly.
              </Text>
            </View>
          )}
        </View>
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
            disabled={isSubmitting || !story.trim()}
            className="min-w-[120px] ml-1 text-white font-bold"
            style={{
              borderRadius: 7,
              paddingVertical: 10,
              paddingHorizontal: 18,
              opacity: (isSubmitting || !story.trim()) ? 0.5 : 1,
            }}
            variant="primary"
            size="md"
          >
            {isSubmitting ? "Submitting..." : "Submit Testimonial"}
          </Button>
        </View>
      </ModalComponent>
    </>
  );
}