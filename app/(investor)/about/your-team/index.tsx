import { Container } from "@/components/Container";
import ModalComponent from "@/components/modal"; // Use ModalComponent
import { useClient } from "@/context/ClientContext";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Mail, MessageCircle, Phone, TrendingUp, User } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Linking, Text, TouchableOpacity, View } from "react-native";

import { api } from "@/api/axios";
import Textarea from "@/components/text-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function Banner() {
  return (
    <View className="mb-4 rounded-sm bg-primary px-3 py-1.5 text-center text-xs font-semibold text-white flex items-center justify-center gap-2">
      <Text className="text-white text-xs font-semibold text-center">
        We believe investing is a partnership. Here are the people and channels dedicated to supporting you.
      </Text>
    </View>
  );
}

function Section({
  title,
  children,
  icon,
}: {
  title: string,
  children: React.ReactNode,
  icon?: React.ReactNode
}) {
  return (
    <View className="bg-white border border-primary-200 rounded-lg p-3" accessible accessibilityLabel={title}>
      <View className="flex flex-row items-center gap-1.5 mb-2">
        {icon}
        <Text className="text-sm font-bold text-foreground">{title}</Text>
      </View>
      <View className="text-xs leading-relaxed text-card-foreground">{children}</View>
    </View>
  );
}

// Send email API
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
  // Axios throws on non-2xx status so no need for manual status check
  try {
    const response = await api.post('/api/send-email', emailData);
    return response.data;
  } catch (error: any) {
    // Attach more helpful error message if possible
    if (error.response && error.response.data) {
      throw new Error(
        typeof error.response.data === "string"
          ? error.response.data
          : (error.response.data?.message || "Failed to send email")
      );
    }
    throw error;
  }
}

export default function YourTeamAtQodePage() {
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);
  const [isDiscussionModalOpen, setIsDiscussionModalOpen] = useState(false);
  const [strategyQuestion, setStrategyQuestion] = useState('');
  const [discussionTopic, setDiscussionTopic] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { toast } = useToast();
  const strategyFormRef = useRef<any>(null);
  const discussionFormRef = useRef<any>(null);

  const {
    selectedClientCode,
    selectedClientId,
    clients,
    loading,
    refresh,
    selectedEmailClient
  } = useClient();

  // Local dropdown value states for modals
  const [localStrategyClientCode, setLocalStrategyClientCode] = useState(selectedClientCode || (clients[0]?.clientcode ?? ""));
  const [localDiscussionClientCode, setLocalDiscussionClientCode] = useState(selectedClientCode || (clients[0]?.clientcode ?? ""));

  // Keep dropdowns in sync with global selectedClientCode whenever the modal opens
  useEffect(() => {
    if (isStrategyModalOpen) {
      setLocalStrategyClientCode(selectedClientCode || (clients[0]?.clientcode ?? ""));
    }
  }, [isStrategyModalOpen, selectedClientCode, clients]);

  useEffect(() => {
    if (isDiscussionModalOpen) {
      setLocalDiscussionClientCode(selectedClientCode || (clients[0]?.clientcode ?? ""));
    }
  }, [isDiscussionModalOpen, selectedClientCode, clients]);

  // Util for client name
  const getClientDisplay = (code: string) => {
    const client = clients.find(client => client.clientcode === code);
    return client
      ? `${client.clientname} (${client.clientcode})`
      : code;
  };

  const handleStrategySubmit = async () => {
    const formData = {
      nuvamaCode: localStrategyClientCode,
      question: strategyQuestion,
    };
    if (!formData.question || !formData.nuvamaCode) {
      toast({
        title: "Error",
        description: "Please provide a Account ID and your question.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    setSubmitStatus('idle');
    const userEmail = selectedEmailClient;
    try {
      const emailHtml = `
      <!DOCTYPE html>
      <html><head><meta charset="utf-8"></head><body>
        <div>
          <h1>Strategy Question from Investor</h1>
          <div>
            <p><strong>Account ID:</strong> ${formData.nuvamaCode}</p>
            <p><strong>Client ID:</strong> ${clients.find(c => c.clientcode === formData.nuvamaCode)?.clientid || ''}</p>
            <p><strong>User Email:</strong> ${userEmail}</p>
            <p><strong>Question:</strong> ${formData.question.replace(/\n/g, '<br>')}</p>
          </div>
        </div>
      </body></html>
      `;
      await sendEmail({
        to: 'investor.relations@qodeinvest.com',
        subject: `New Strategy Question from ${formData.nuvamaCode}`,
        html: emailHtml,
        from: 'investor.relations@qodeinvest.com',
        fromName: 'Qode Investor Relations',
        inquiry_type: 'strategy',
        nuvama_code: formData.nuvamaCode,
        client_id: clients.find(c => c.clientcode === formData.nuvamaCode)?.clientid || '',
        user_email: userEmail,
        question: formData.question,
        priority: 'normal'
      });
      setSubmitStatus('success');
      toast({
        title: "Thank you!",
        description: "Your strategy question has been submitted successfully. We will get back to you soon.",
      });
      setStrategyQuestion('');
      setTimeout(() => {
        setIsStrategyModalOpen(false);
        setSubmitStatus('idle');
      }, 2000);
    } catch (error) {
      setSubmitStatus('error');
      toast({
        title: "Error",
        description: "Failed to send your question. Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscussionSubmit = async () => {
    const formData = {
      nuvamaCode: localDiscussionClientCode,
      topic: discussionTopic,
    };
    if (!formData.topic || !formData.nuvamaCode) {
      toast({
        title: "Error",
        description: "Please provide a Account ID and your discussion topic.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    setSubmitStatus('idle');
    const userEmail = selectedEmailClient;
    try {
      const emailHtml = `
      <!DOCTYPE html>
      <html><head><meta charset="utf-8"></head><body>
        <div>
          <h1>Call Discussion Topic from Investor</h1>
          <div>
            <p><strong>Account ID:</strong> ${formData.nuvamaCode}</p>
            <p><strong>Client ID:</strong> ${clients.find(c => c.clientcode === formData.nuvamaCode)?.clientid || ''}</p>
            <p><strong>User Email:</strong> ${userEmail}</p>
            <p><strong>Topic:</strong> ${formData.topic.replace(/\n/g, '<br>')}</p>
          </div>
        </div>
      </body></html>
      `;
      await sendEmail({
        to: 'investor.relations@qodeinvest.com',
        subject: `New Call Discussion Topic from ${formData.nuvamaCode}`,
        html: emailHtml,
        from: 'investor.relations@qodeinvest.com',
        fromName: 'Qode Investor Relations',
        inquiry_type: 'discussion',
        nuvama_code: formData.nuvamaCode,
        client_id: clients.find(c => c.clientcode === formData.nuvamaCode)?.clientid || '',
        user_email: userEmail,
        topic: formData.topic,
        priority: 'normal'
      });
      setSubmitStatus('success');
      toast({
        title: "Thank you!",
        description: "Your discussion topic has been submitted successfully. We will get back to you soon",
      });
      setDiscussionTopic('');
      setTimeout(() => {
        setIsDiscussionModalOpen(false);
        setSubmitStatus('idle');
      }, 2000);
    } catch (error) {
      setSubmitStatus('error');
      toast({
        title: "Error",
        description: "Failed to send your topic. Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Fix Book a Call handler ---
  // Define the function to open Book a Call URL
  const handleBookACall = () => {
    // This is the CRM Zoho Bookings link (PRODUCTION link as per previous code comment)
    const bookingUrl = "https://crm.zoho.in/bookings/30minutesmeeting?rid=5ec313c47c4d600297f76c4db5ed16b9ec7023047ad9adae51cf7233a95aed39b78a114a405bd5ecb516bbd5c82eb973gid34d89af86b644a5bbc06e671dae756f5663840a52f688352fdf9715c33a97bcd";
    Linking.openURL(bookingUrl)
      .catch(err => {
        toast({
          title: "Error",
          description: "Failed to open booking page. Please try again later.",
          variant: "destructive",
        });
      });
  };

  if (loading) {
    return (
      <View className="space-y-6 p-4">
        <View className="animate-pulse">
          <View className="h-8 bg-gray-300 rounded w-64 mb-2" />
          <View className="h-4 bg-gray-300 rounded w-96" />
        </View>
      </View>
    );
  }

  if (clients.length === 0) {
    return (
      <View className="space-y-6 p-4">
        <View className="mb-2">
          <Text className="text-xl font-bold text-foreground flex flex-row items-center gap-2">
            Your Team at Qode
          </Text>
          <Text className="text-sm text-muted-foreground">
            No client accounts found. Please contact support.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Container className="p-4 w-full rounded-lg bg-card">
      <View className="flex gap-1.5 mb-3">
        <Text className="font-serif text-base text-foreground">
          Your Team at Qode
        </Text>
        <Text className="text-xs text-muted-foreground">
          Reach the right person quickly, and choose the channel that suits your query.
        </Text>
        {selectedClientCode && (
          <View className="bg-primary-50 border border-primary-200 rounded-md px-2 py-1 mt-1">
            <Text className="text-xs text-primary font-medium">
              Current Account: {selectedClientCode}
            </Text>
          </View>
        )}
      </View>

      <Banner />

      <View className="flex flex-col gap-3">

        {/* Fund Manager */}
        <Section title="Fund Manager" icon={<TrendingUp size={16} className="text-primary" />}>
          <Text className="mb-2 text-xs leading-relaxed text-muted-foreground">
            Oversees your portfolio strategy and ensures alignment with Qode's philosophy. Contact for strategy queries, portfolio discussions, or during reviews.
          </Text>
          <TouchableOpacity
            className="flex flex-row w-full gap-1.5 rounded-md bg-primary p-2 items-center justify-center mt-2"
            onPress={() => setIsStrategyModalOpen(true)}
          >
            <MessageCircle size={14} className="text-white" />
            <Text className="text-white text-xs font-medium">Ask Strategy Question</Text>
          </TouchableOpacity>
        </Section>

        {/* Investor Relations */}
        <Section title="Investor Relations" icon={<User size={16} className="text-primary" />}>
          <Text className="mb-2 text-xs leading-relaxed text-muted-foreground">
            Your regular point of contact for monthly updates, review calls, reports, and operational support including onboarding, top-ups, withdrawals, and portal access.
          </Text>
          <View className="flex flex-col gap-2 mt-2">
            <TouchableOpacity
              className="flex flex-row w-full gap-1.5 rounded-md bg-primary p-2 items-center justify-center"
              onPress={() => {
                const mailto = `mailto:investor.relations@qodeinvest.com?subject=IR%20Support%20Request%20-%20${selectedClientCode || 'Account'}`;
                Linking.openURL(mailto);
              }}
            >
              <Mail size={14} className="text-white" />
              <Text className="text-white text-xs font-medium">Email IR Team</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex flex-row w-full gap-1.5 rounded-md border border-primary bg-white p-2 items-center justify-center"
              onPress={() => setIsDiscussionModalOpen(true)}
            >
              <MessageCircle size={14} className="text-primary" />
              <Text className="text-primary text-xs font-medium">Raise Query</Text>
            </TouchableOpacity>
          </View>
        </Section>

        {/* Book a Call */}
        <Section title="Book a Call" icon={<Calendar size={16} className="text-primary" />}>
          <Text className="mb-2 text-xs leading-relaxed text-muted-foreground">
            Quick and hassle-free scheduling of calls with your IR team at a time convenient for you.
          </Text>
          <TouchableOpacity
            className="flex flex-row w-full gap-1.5 rounded-md bg-primary p-2 items-center justify-center mt-2"
            onPress={handleBookACall}
          >
            <Calendar size={14} className="text-white" />
            <Text className="text-white text-xs font-medium">Schedule Call</Text>
          </TouchableOpacity>
        </Section>

        {/* Direct Contact */}
        <Section title="Direct Contact" icon={<Phone size={16} className="text-primary" />}>
          <Text className="mb-2 text-xs leading-relaxed text-muted-foreground">
            For instant and quick communication with the IR desk.
          </Text>
          <View className="flex flex-col gap-2 bg-gray-50 border border-gray-200 rounded-md p-2">
            <View className="flex flex-row items-center gap-2">
              <Phone size={12} className="text-primary" />
              <View className="flex-1">
                <Text className="text-[10px] text-muted-foreground">WhatsApp</Text>
                <Text className="text-xs font-semibold text-foreground" selectable>
                  +91 98203 00028
                </Text>
                <Text className="text-[10px] text-muted-foreground">9 AM – 5 PM</Text>
              </View>
            </View>
            <View className="h-px bg-gray-200" />
            <View className="flex flex-row items-center gap-2">
              <Mail size={12} className="text-primary" />
              <View className="flex-1">
                <Text className="text-[10px] text-muted-foreground">Email</Text>
                <Text className="text-xs font-semibold text-foreground" selectable>
                  investor.relations@qodeinvest.com
                </Text>
              </View>
            </View>
          </View>
        </Section>
      </View>

      {/* Strategy Question Modal */}
      <ModalComponent
        isOpen={isStrategyModalOpen}
        onClose={() => {
          setIsStrategyModalOpen(false);
          setStrategyQuestion('');
          setSubmitStatus('idle');
        }}
        title="Ask a Strategy Question"
        contentClassName="bg-card rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
        headerClassName="flex flex-row items-center justify-between p-3 border-b border-border"
        bodyClassName="p-3"
      >
        <View className="flex gap-2">
          <View>
            <Text className="block text-sm font-medium text-foreground mb-2">
              Account ID
            </Text>
            <View className="w-full h-10 p-0 border border-border rounded-md bg-background text-foreground">
              <Select
                value={localStrategyClientCode}
                onValueChange={(itemValue) => {
                  setLocalStrategyClientCode(itemValue);
                }}
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-full h-8">
                  <SelectValue placeholder="Select Account" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem
                      key={client.clientcode}
                      value={client.clientcode}
                    >
                      {`${client.clientname} (${client.clientcode})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </View>
            <Text className="text-[10px] text-muted-foreground mt-0.5">
              Currently selected: {getClientDisplay(localStrategyClientCode)}
            </Text>
          </View>
          <View>
            <Text className="block text-xs font-medium text-foreground mb-1.5">
              Your Question
            </Text>
            <Textarea
              value={strategyQuestion}
              onChangeText={setStrategyQuestion}
              className="w-full p-2 border border-border rounded-md bg-background text-foreground resize-none focus:ring-2 focus:ring-primary focus:border-primary text-xs"
              placeholder="Please describe your strategy-related question or concern..."
              editable={!isSubmitting}
            />
          </View>
          {submitStatus === 'success' && (
            <View className="p-2 bg-green-100 border border-green-400 text-green-700 rounded text-xs">
              <Text className="text-xs">
                Your strategy question has been sent successfully! Thank you for your input. We Will get back to you soon.
              </Text>
            </View>
          )}
          {submitStatus === 'error' && (
            <View className="p-2 bg-red-100 border border-red-400 text-red-700 rounded text-xs">
              <Text className="text-xs">
                Failed to send your question. Please try again or contact us directly.
              </Text>
            </View>
          )}
          <View className="flex flex-row mt-0.5 gap-2 justify-end">
            <TouchableOpacity
              onPress={() => {
                setIsStrategyModalOpen(false);
                setStrategyQuestion('');
                setSubmitStatus('idle');
              }}
              className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
              disabled={isSubmitting}
            >
              <Text className="text-xs">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleStrategySubmit}
              className="px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || !strategyQuestion.trim()}
            >
              <Text className="text-xs">{isSubmitting ? 'Sending...' : 'Submit Question'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ModalComponent>

      {/* Discussion Topic Modal */}
      <ModalComponent
        isOpen={isDiscussionModalOpen}
        onClose={() => {
          setIsDiscussionModalOpen(false);
          setDiscussionTopic('');
          setSubmitStatus('idle');
        }}
        title="What Would You Like to Discuss?"
        contentClassName="bg-card rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
        headerClassName="flex flex-row items-center justify-between p-3 border-b border-border"
        bodyClassName="p-3"
      >
        <View className="flex gap-1.5">
          <View>
            <Text className="block text-xs font-medium text-foreground mb-1.5">
              Account ID
            </Text>
            <View className="w-full h-8 p-0 border border-border rounded-md bg-background text-foreground">
              <Select
                value={localDiscussionClientCode}
                onValueChange={itemValue => {
                  setLocalDiscussionClientCode(itemValue);
                }}
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-full h-8">
                  <SelectValue placeholder="Select Account" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem
                      key={client.clientcode}
                      value={client.clientcode}
                    >
                      {`${client.clientname} (${client.clientcode})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </View>
            <Text className="text-[10px] text-muted-foreground mt-0.5">
              Currently selected: {getClientDisplay(localDiscussionClientCode)}
            </Text>
          </View>
          <View>
            <Text className="block text-xs font-medium text-foreground mb-1.5">
              Discussion Topic
            </Text>
            <Textarea
              value={discussionTopic}
              onChangeText={setDiscussionTopic}
              className="w-full p-2 border border-border rounded-md bg-background text-foreground resize-none focus:ring-2 focus:ring-primary focus:border-primary text-xs"
              placeholder="Please describe what you'd like to discuss during the call..."
              editable={!isSubmitting}
            />
          </View>
          {submitStatus === 'success' && (
            <View className="p-2 bg-green-100 border border-green-400 text-green-700 rounded text-xs">
              <Text className="text-xs">
                Your discussion topic has been sent successfully! Thank you for your input. We Will get back to you soon.
              </Text>
            </View>
          )}
          {submitStatus === 'error' && (
            <View className="p-2 bg-red-100 border border-red-400 text-red-700 rounded text-xs">
              <Text className="text-xs">
                Failed to send your topic. Please try again or contact us directly.
              </Text>
            </View>
          )}
          <View className="flex flex-row mt-0.5 gap-2 justify-end">
            <TouchableOpacity
              onPress={() => {
                setIsDiscussionModalOpen(false);
                setDiscussionTopic('');
                setSubmitStatus('idle');
              }}
              className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
              disabled={isSubmitting}
            >
              <Text className="text-xs">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDiscussionSubmit}
              className="px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || !discussionTopic.trim()}
            >
              <Text className="text-xs">{isSubmitting ? 'Sending...' : 'Submit Topic'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ModalComponent>
    </Container>
  );
}