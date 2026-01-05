import { useClient } from "@/context/ClientContext";
import useLogout from "@/hooks/logout";
import { MaterialIcons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React, { ReactNode, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordian";

// Import all lucide-react-native icons needed
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Building2,
  Calendar,
  Crown,
  CrownIcon,
  FileKey,
  Gift,
  HelpCircle,
  Info,
  MessageSquare,
  Settings,
  Shield,
  Target,
  TrendingUp,
  User,
  Users
} from "lucide-react-native";

interface NavLinkProps {
  children: ReactNode;
  url: string;
  onClick?: () => void;
  icon?: ReactNode;
}

const NavLink = ({ children, url, onClick, icon }: NavLinkProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const fullPathname = pathname.startsWith("/(investor)") ? pathname : `/(investor)${pathname}`;

  const handlePress = () => {
    router.push(url as any);
    onClick && onClick();
  };

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={10}
      className={[
        "p-2 flex flex-row items-center gap-2 rounded-lg",
        fullPathname === url ? "bg-background" : "",
      ].join(" ")}
    >
      {icon && (
        <View
          className="mr-2"
          style={{
            opacity: fullPathname === url ? 1 : 0.7,
          }}
        >
          {React.isValidElement(icon)
            ? React.cloneElement(
                icon as React.ReactElement<any>,
                {
                  ...(icon.props || {}),
                  color: fullPathname === url ? "#1e293b" : "#efecd3"
                }
              )
            : icon}
        </View>
      )}
      <Text
        className={[
          "text-base",
          fullPathname === url ? "text-primary" : "text-secondary"
        ].join(" ")}
      >
        {children}
      </Text>
    </Pressable>
  );
};

const MobileAccountDropdown = () => {
  const {
    clients,
    isHeadOfFamily,
    selectedClientCode,
    setSelectedClient,
    selectedClientHolderName,
    selectedClientType,
  } = useClient();

  const [open, setOpen] = useState(false);

  const displayName = selectedClientHolderName || "Account";
  const roleDisplay = isHeadOfFamily ? "Head of Family" : "Owner";

  const handleClientSelect = (clientCode: string) => setSelectedClient(clientCode);

  return (
    <View className="relative">
      {/* Dropdown content is rendered above the Pressable */}
      {open && (
        <View className="absolute w-full z-50 bg-background rounded-lg shadow-lg align-end bottom-full mb-1 px-2 border border-slate-200 min-w-[256px]">
          
          <View className="flex flex-row items-center gap-2 px-1 pt-3 pb-2">
            {isHeadOfFamily ? (
              <>
                <View className="mr-0.5">
                  <CrownIcon className="h-2 w-2 text-blue-600 shrink-0" />
                </View>
                <Text className="text-normal font-sans text-primary flex-1 truncate">
                  Family Accounts ({clients.length})
                </Text>
                <View className="ml-2 bg-blue-100 border border-blue-200 rounded-lg px-2 py-0.5">
                  <Text className="text-xs text-blue-700">{roleDisplay}</Text>
                </View>
              </>
            ) : (
              <>
                <View className="mr-0.5">
                  <User className="h-2 w-2 text-gray-600 shrink-0" />
                </View>
                <Text className="text-normal font-sans text-primary flex-1 truncate">
                  My Accounts ({clients.length})
                </Text>
                <View className="ml-2 bg-slate-100 border border-slate-200 rounded-lg px-2 py-0.5">
                  <Text className="text-xs text-gray-700">{roleDisplay}</Text>
                </View>
              </>
            )}
          </View>

          <View className="border-t border-black-200 my-1 mx-1" />

          {clients.length ? (
            <FlatList
              data={clients}
              keyExtractor={item => item.clientid}
              renderItem={({ item: client }) => (
                <Pressable
                  onPress={() => handleClientSelect(client.clientcode)}
                  className={[
                    "flex flex-row items-center rounded-sm p-1",
                    selectedClientCode === client.clientcode
                      ? "bg-card"
                      : "bg-background",
                  ].join(" ")}
                  style={({ pressed }) => pressed && selectedClientCode !== client.clientcode
                    ? { backgroundColor: "#F8FAFC" }
                    : undefined}
                  testID={`dropdown-client-${client.clientcode}`}
                >
                  {/* Role indicator for client */}
                  <View className="mr-2">
                    {client.head_of_family ? (
                      <Users className="h-2 w-2 text-blue-600" />
                    ) : isHeadOfFamily ? (
                      <User className="h-2 w-2 text-gray-600" />
                    ) : (
                      <User className="h-2 w-2 text-gray-600" />
                    )}
                  </View>
                  {/* Client's info */}
                  <View className="flex-1 min-w-0">
                    <Text className="font-normal font-sans truncate" numberOfLines={1} ellipsizeMode="tail">
                      {client.holderName || client.clientname || client.clientcode}
                    </Text>
                    <View className="flex flex-row items-center gap-2 mt-0.5">
                      <Text className="text-xs text-gray-500 truncate" numberOfLines={1}>
                        {client.clientcode}
                      </Text>
                      {isHeadOfFamily && client.relation && (
                        <>
                          <Text className="mx-0.5 text-slate-400">•</Text>
                          <Text className="text-xs text-gray-400 truncate" numberOfLines={1}>
                            {client.relation}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                  {/* Active dot */}
                  {selectedClientCode === client.clientcode && (
                    <View className="ml-2 h-2 w-2 rounded-full bg-primary" />
                  )}
                </Pressable>
              )}
              ItemSeparatorComponent={() => <View className="h-0.5" />}
              style={{ maxHeight: 240 }}
              contentContainerStyle={{ paddingVertical: 2 }}
            />
          ) : (
            <View className="px-4 py-3">
              <Text className="text-gray-400">No accounts found</Text>
            </View>
          )}

          {/* Separator */}
          <View className="border-t border-black-200 my-1 mx-1" />
          {/* Role explanation */}
          <View className="px-4 py-2">
            <Text className="text-xs text-gray-500">
              {isHeadOfFamily
                ? "As head of family, you can view all family accounts"
                : "Owner account access only"}
            </Text>
          </View>
        </View>
      )}

      <Pressable
        className="flex flex-row w-full items-center justify-between gap-2 rounded-md border bg-background px-3 py-2"
        onPress={() => setOpen(!open)}
        testID="mobile-account-dropdown-trigger"
      >
        <View className="flex flex-row items-center gap-2 shrink flex-1">
          {isHeadOfFamily ? (
            <View className="mr-1">
              <Crown className="h-2 w-2 text-blue-600 shrink-0" />
            </View>
          ) : (
            <View className="mr-1">
              <User className="h-2 w-2 text-gray-600 shrink-0" />
            </View>
          )}

          <Text
            className="font-normal font-sans text-base text-primary"
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{ maxWidth: 120 }}
          >
            {displayName}
          </Text>
        </View>
        <MaterialIcons 
          name={open ? "expand-less" : "expand-more"} 
          size={22} 
          color="#2563eb"
        />
      </Pressable>
    </View>
  );
};

/* -------------------- Sidebar Content -------------------- */

interface SidebarContentMobileProps {
  onClose?: () => void;
}

const SidebarContentMobile = ({ onClose }: SidebarContentMobileProps) => {

  const pathname = usePathname();
  
  const getInitialAccordion = () => {
    if (pathname.includes('/portfolio')) return ['portfolio'];
    if (pathname.includes('/about')) return ['about'];
    if (pathname.includes('/portal-guide') || 
        pathname.includes('/account-services') || 
        pathname.includes('/account-mapping') ||
        pathname.includes('/service-cadence')) return ['experience'];
    if (pathname.includes('/engagement')) return ['engagement'];
    if (pathname.includes('/vault') || 
        pathname.includes('/risk-management') || 
        pathname.includes('/grievance-redressal') ||
        pathname.includes('/faqs-glossary')) return ['trust'];
    return ['portfolio']; // default
  };

  const [openAccordions, setOpenAccordions] = useState<string[]>(getInitialAccordion());

  React.useEffect(() => {
    setOpenAccordions(getInitialAccordion());
  }, [pathname]);

  return (
    <Accordion value={openAccordions} onValueChange={setOpenAccordions}>
      <AccordionItem value="portfolio">
        <AccordionTrigger>
          <View className="flex flex-row items-center">
            <TrendingUp size={16} color="#efecd3" style={{ marginRight: 8 }} />
            <Text className="text-secondary font-serif text-lg">Portfolio</Text>
          </View>
        </AccordionTrigger>
        <AccordionContent className="ml-4">
          <NavLink url="/(investor)/portfolio/performance" onClick={onClose} icon={<BarChart3 size={16} />}>
            <Text>Performance</Text>
          </NavLink>
          <NavLink url="/(investor)/portfolio/snapshot" onClick={onClose} icon={<BookOpen size={16} />}>
            <Text>Snapshot</Text>
          </NavLink>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="about">
        <AccordionTrigger>
          <View className="flex flex-row items-center">
            <Info size={16} color="#efecd3" style={{ marginRight: 8 }} />
            <Text className="text-secondary font-serif text-lg">About Qode</Text>
          </View>
        </AccordionTrigger>
        <AccordionContent className="ml-4">
          <NavLink url="/(investor)/about/qode-philosophy" onClick={onClose} icon={<Building2 size={16} />}>
            <Text>Qode Philosophy</Text>
          </NavLink>
          <NavLink url="/(investor)/about/foundation" onClick={onClose} icon={<Building2 size={16} />}>
            <Text>Foundation</Text>
          </NavLink>
          <NavLink url="/(investor)/about/strategy-snapshot" onClick={onClose} icon={<Target size={16} />}>
            <Text>Strategy Snapshot</Text>
          </NavLink>
          <NavLink url="/(investor)/about/your-team" onClick={onClose} icon={<Users size={16} />}>
            <Text>Your Team At Qode</Text>
          </NavLink>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="experience">
        <AccordionTrigger>
          <View className="flex flex-row items-center">
            <BookOpen size={16} color="#efecd3" style={{ marginRight: 8 }} />
            <Text className="text-secondary font-serif text-lg">Your Qode Experience</Text>
          </View>
        </AccordionTrigger>
        <AccordionContent className="ml-4">
          <NavLink url="/(investor)/experience/portal-guide" onClick={onClose} icon={<BookOpen size={16} />}>
            <Text>Investor Portal Guide</Text>
          </NavLink>
          <NavLink url="/(investor)/experience/account-services" onClick={onClose} icon={<Settings size={16} />}>
            <Text>Account Services</Text>
          </NavLink>
          <NavLink url="/(investor)/experience/account-mapping" onClick={onClose} icon={<Users size={16} />}>
            <Text>Account Mapping</Text>
          </NavLink>
          <NavLink url="/(investor)/experience/service-cadence" onClick={onClose} icon={<Users size={16} />}>
            <Text>Service Cadence</Text>
          </NavLink>
        </AccordionContent>
      </AccordionItem>

      {/* Engagement & Growth Accordion Section */}
      <AccordionItem value="engagement">
        <AccordionTrigger>
          <View className="flex flex-row items-center">
            <MessageSquare size={16} color="#efecd3" style={{ marginRight: 8 }} />
            <Text className="text-secondary font-serif text-lg">Engagement & Growth</Text>
          </View>
        </AccordionTrigger>
        <AccordionContent className="ml-4">
          <NavLink url="/(investor)/engagement/your-voice-matters" onClick={onClose} icon={<MessageSquare size={16} />}>
            <Text>Your Voice Matters</Text>
          </NavLink>
          <NavLink url="/(investor)/engagement/referral-program" onClick={onClose} icon={<Gift size={16} />}>
            <Text>Referral Program</Text>
          </NavLink>
          <NavLink url="/(investor)/engagement/insights-and-events" onClick={onClose} icon={<Calendar size={16} />}>
            <Text>Insights & Events</Text>
          </NavLink>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="trust">
        <AccordionTrigger>
          <View className="flex flex-row items-center">
            <Shield size={16} color="#efecd3" style={{ marginRight: 8 }} />
            <Text className="text-secondary font-serif text-lg">Trust & Security</Text>
          </View>
        </AccordionTrigger>
        <AccordionContent className="ml-4">
          <NavLink url="/(investor)/trust/vault" onClick={onClose}
                  icon={<FileKey size={16} />}>
            <Text>Client Document Vault</Text>
          </NavLink>
          <NavLink url="/(investor)/trust/risk-management" onClick={onClose}
                  icon={<Shield size={16} />}>
            <Text>Risk Management</Text>
          </NavLink>
          <NavLink url="/(investor)/trust/grievance-redressal" onClick={onClose}
                  icon={<AlertTriangle size={16} />}>
            <Text>Grievance Redressal</Text>
          </NavLink>
          <NavLink url="/(investor)/trust/faqs-glossary" onClick={onClose} icon={<HelpCircle size={16} />}>
            <Text>FAQs & Glossary</Text>
          </NavLink>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

/* -------------------- Sidebar -------------------- */

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const insets = useSafeAreaInsets();
  const {
    clients,
    selectedClientCode,
    selectedClientHolderName
  } = useClient()

  // Get the display name (same logic as header)
  const selectedClient = clients.find(c => c.clientcode === selectedClientCode)
  const displayName = selectedClientHolderName || selectedClient?.holderName || selectedClient?.clientname || selectedClientCode || (clients[0]?.holderName || clients[0]?.clientname || clients[0]?.clientcode) || "Select Account"

  const { logout, isPending } = useLogout();

  return (
    <View
      style={{ paddingTop: insets.top }}
      className="flex-1 bg-background"
    >
      <View className="flex-1 w-full">
        {/* Header */}
        <View className="px-6 py-6">
          <Text className="font-serif text-2xl font-bold text-primary">
            Hello {displayName}!
          </Text>
        </View>

        {/* Content */}
        <View className="flex-1 bg-primary">
          <ScrollView
            contentContainerStyle={{ padding: 12 }}
            showsVerticalScrollIndicator={false}
          >
            <SidebarContentMobile onClose={onClose} />
          </ScrollView>

          {/* Footer (Fixed) */}
          <View className="gap-3 px-4 pb-6 mb-6">
            <MobileAccountDropdown />
            <Pressable
              onPress={logout}
              disabled={isPending}
              className={`rounded-lg border border-accent py-3 items-center ${
                isPending ? "opacity-50" : ""}`}
            >
              <Text className="text-base font-bold text-accent">
                {isPending ? "Logging out..." : "Logout"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
