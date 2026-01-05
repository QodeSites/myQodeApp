import { api } from "@/api/axios";
import { useClient } from "@/context/ClientContext";
import { useToast } from "@/hooks/use-toast";

import React, { useRef, useState } from "react";
import { ActivityIndicator, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

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
    let contentType: string | undefined = undefined;
    if (response.headers) {
      if (typeof response.headers.get === "function") {
        const headerVal = response.headers.get("content-type");
        if (typeof headerVal === "string") {
          contentType = headerVal;
        }
      } else if (typeof response.headers["content-type"] === "string") {
        contentType = response.headers["content-type"];
      }
    }
    if (response.status < 200 || response.status >= 300) {
      const errorBody = response.data;
      console.error("API response not OK:", {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
      });
      throw new Error(`Failed to send email: ${response.status} ${response.statusText}`);
    }
    if (contentType && contentType.includes("application/json")) {
      const data = response.data;
      console.log("API response data:", data);
      return data;
    } else {
      console.warn("API response is not JSON:", response.data);
      return { success: true };
    }
  } catch (error) {
    console.error("Email sending failed:", error);
    throw error;
  }
}

export function TestimonialDialog({
  triggerLabel = "Open Testimonial Form",
}: Props) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const { toast } = useToast();
  const { selectedClientCode, selectedClientId, clients, loading, selectedEmailClient } = useClient();
  const [story, setStory] = useState("");
  const formRef = useRef<any>(null);

  const onSubmit = async () => {
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
        setStory("");
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
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        className="bg-primary text-white border border-gray-300 p-2.5 rounded h-content"
        style={{ alignSelf: "flex-start" }}
      >
        <Text
          className="bg-primary text-white font-sans"
          numberOfLines={1}
        >
          {triggerLabel}
        </Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 justify-center items-center bg-black/60 max-w-xl">
          <View className="w-11/12 max-w-xl bg-card rounded-lg p-5">
            <View>
              <Text className="text-lg font-sans mb-4">
                Share Your Qode Experience
              </Text>
            </View>
            <ScrollView>
              <View className="mb-2">
                <View className="grid gap-2 mb-2.5">
                  <Text className="label font-sans mb-1">
                    Your testimonial story
                  </Text>
                  <TextInput
                    ref={formRef}
                    className="textarea min-h-[140px] border border-gray-300 rounded-lg p-2 text-top"
                    multiline
                    value={story}
                    onChangeText={setStory}
                    placeholder="Tell us about your journey with Qode..."
                    placeholderTextColor="#888"
                    editable={!isSubmitting}
                    textAlignVertical="top"
                  />
                </View>
                {submitStatus === "success" && (
                  <View className="p-3 bg-green-100 border border-green-400 rounded text-green-700 text-sm mb-2">
                    <Text className="text-green-700 text-sm">
                      Your testimonial has been sent successfully! Thank you for your input.
                    </Text>
                  </View>
                )}
                {submitStatus === "error" && (
                  <View className="p-3 bg-red-100 border border-red-400 rounded text-red-700 text-sm mb-2">
                    <Text className="text-red-700 text-sm">
                      Failed to send testimonial. Please try again or contact us directly.
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
            <View className="flex flex-row justify-end gap-3 pt-4">
              <TouchableOpacity
                className="border bg-card text-black rounded border-gray-300 py-2 px-4 min-w-[80px] items-center mr-2"
                disabled={isSubmitting}
                onPress={() => {
                  setStory("");
                  setSubmitStatus("idle");
                  setOpen(false);
                }}
              >
                <Text className="text-black">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`bg-primary text-white hover:opacity-90 rounded py-2 px-4 items-center min-w-[120px] ${isSubmitting ? "opacity-60" : ""}`}
                disabled={isSubmitting}
                onPress={onSubmit}
              >
                {isSubmitting ? (
                  <View className="flex flex-row items-center">
                    <ActivityIndicator color="#fff" size="small" />
                    <Text className="text-white ml-2">
                      Submitting...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-white">Submit Testimonial</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}