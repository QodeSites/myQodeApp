import { api } from "@/api/axios";
import { Container } from "@/components/Container";
import ModalComponent from "@/components/modal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClient } from "@/context/ClientContext";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, ChevronRight, Crown, User } from "lucide-react-native";
import React, { useEffect, useMemo, useState, useTransition } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";


type FamAcc = {
    relation: string;
    holderName: string | null | undefined;
    clientcode: string;
    clientid: string;
    status: "Active" | "Pending KYC" | "Dormant";
    groupid?: string;
    groupname?: string | null | undefined;
    groupemailid?: string;
    ownerid?: string;
    ownername?: string | null | undefined;
    owneremailid?: string;
    accountname?: string;
    accountid?: string;
    email?: string;
    mobile?: string;
    address1?: string;
    city?: string;
    state?: string;
    pannumber?: string;
    head_of_family?: boolean;
};

async function sendEmail(payload: {
    to: string;
    subject: string;
    html: string;
    from?: string;
    fromName?: string;
    inquiry_type?: string;
    nuvama_code?: string;
    client_id?: string;
    user_email?: string;
    message?: string;
}) {
    let response;
    try {
        response = await api.post(
            "/api/send-email",
            {
                ...payload,
                inquiry_type: payload.inquiry_type || "family_mapping",
                nuvama_code: payload.nuvama_code,
                client_id: payload.client_id,
                user_email: payload.user_email,
            },
            {
                headers: { "Content-Type": "application/json" },
            }
        );
    } catch (error: any) {
        // Axios puts error response on error.response
        let msg = "Email API error";
        if (error.response && error.response.data) {
            if (typeof error.response.data === "string") {
                msg = error.response.data;
            } else if (error.response.data.message) {
                msg = error.response.data.message;
            }
        }
        throw new Error(msg);
    }
    // Axios automatically parses JSON response. response.data is parsed object.
    return response.data ?? {};
}

const sanitizeName = (name: string | null | undefined) => {
    if (!name || name === "null" || (typeof name === "string" && name.includes("null"))) {
        return name?.replace(/\s*null\s*/g, "").trim() || "Unknown";
    }
    return name?.trim?.() ?? "";
};

const FamilyTreeSkeleton = () => (
    <View className="space-y-4">
        <View className="bg-card rounded-xl shadow p-5 mb-2 animate-pulse">
            <View className="h-5 w-48 bg-muted rounded mb-4" />
            <View className="pl-4 space-y-3">
                <View className="h-4 w-36 bg-muted rounded mb-2" />
                <View className="pl-4">
                    <View className="h-3 w-24 bg-muted rounded" />
                </View>
            </View>
        </View>
    </View>
);

export default function FamilyAccountsSection() {
    const { clients, selectedClientCode, setSelectedClient, loading } = useClient();
    const [isPending] = useTransition();
    const { toast } = useToast && useToast(); // in case useToast is a hook
    const [familyAccounts, setFamilyAccounts] = useState<FamAcc[]>([]);
    const [isHeadOfFamily, setIsHeadOfFamily] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<"All Statuses" | "Active" | "Pending KYC" | "Dormant">("All Statuses");
    const [modalOpen, setModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
    const [collapsedOwners, setCollapsedOwners] = useState<Set<string>>(new Set());
    const [collapsedAccounts, setCollapsedAccounts] = useState<Set<string>>(new Set());
    const [requestMessage, setRequestMessage] = useState("");

    const onClose = () => setModalOpen(false);

    useEffect(() => {
        const fetchFamilyAccounts = async () => {
            try {
                const res = await api.get("/api/auth/client-data");
                const data = await res.data;
                if (data.success && data.family) {
                    const mapped: FamAcc[] = data.family.map((member: any) => ({
                        clientid: member.clientid,
                        clientcode: member.clientcode,
                        holderName: sanitizeName(member.holderName),
                        relation: member.relation,
                        status: member.status,
                        groupid: member.groupid,
                        groupname: sanitizeName(member.groupname),
                        groupemailid: member.groupemailid,
                        ownerid: member.ownerid,
                        ownername: sanitizeName(member.ownername),
                        owneremailid: member.email,
                        accountname: member.accountname,
                        accountid: member.clientcode,
                        email: member.email,
                        mobile: member.mobile,
                        address1: member.address1,
                        city: member.city,
                        state: member.state,
                        pannumber: member.pannumber,
                        head_of_family: member.head_of_family,
                    }));
                    setFamilyAccounts(mapped);
                    setIsHeadOfFamily(data.isHeadOfFamily || false);
                }
            } catch (err) {
                // Could display an error toast here
            }
        };
        fetchFamilyAccounts();
    }, []);

    const selectedClient = useMemo(
        () => clients.find(c => c.clientcode === selectedClientCode),
        [clients, selectedClientCode]
    );
    const selectedClientId = selectedClient?.clientid ?? "";

    const fallbackEmail = useMemo(() => {
        const forSelected = familyAccounts.find(f => f.clientcode === selectedClientCode);
        return (
            forSelected?.email ||
            forSelected?.owneremailid ||
            forSelected?.groupemailid ||
            "investor.relations@qodeinvest.com"
        );
    }, [familyAccounts, selectedClientCode]);

    const filteredAccounts = useMemo(() => {
        return familyAccounts.filter(acc => {
            const q = searchTerm.toLowerCase();
            const matchesSearch =
                sanitizeName(acc.holderName)?.toLowerCase().includes(q) ||
                acc.clientcode?.toLowerCase().includes(q) ||
                sanitizeName(acc.groupname)?.toLowerCase().includes(q) ||
                sanitizeName(acc.ownername)?.toLowerCase().includes(q) ||
                acc.email?.toLowerCase().includes(q) ||
                false;
            const matchesStatus = statusFilter === "All Statuses" || acc.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [familyAccounts, searchTerm, statusFilter]);

    const groupedAccounts = useMemo(() => {
        const groups = filteredAccounts.reduce((acc, member) => {
            const groupKey = sanitizeName(member.groupname) || "Owner Account";
            if (!acc[groupKey]) {
                acc[groupKey] = {
                    groupName: sanitizeName(member.groupname),
                    groupId: member.groupid,
                    groupEmail: member.groupemailid,
                    owners: {} as Record<
                        string,
                        { ownerId?: string; ownerName?: string; ownerEmail?: string; accounts: FamAcc[] }
                    >,
                };
            }
            const ownerKey = member.ownerid || member.clientid || "Owner";
            if (!acc[groupKey].owners[ownerKey]) {
                acc[groupKey].owners[ownerKey] = {
                    ownerId: member.ownerid || member.clientid,
                    ownerName: sanitizeName(member.ownername || member.holderName),
                    ownerEmail: member.owneremailid,
                    accounts: [],
                };
            }
            acc[groupKey].owners[ownerKey].accounts.push(member);
            return acc;
        }, {} as Record<
            string,
            {
                groupName?: string;
                groupId?: string;
                groupEmail?: string;
                owners: Record<string, { ownerId?: string; ownerName?: string; ownerEmail?: string; accounts: FamAcc[] }>;
            }
        >);

        Object.values(groups).forEach(group => {
            Object.values(group.owners).forEach(owner => {
                owner.accounts.sort((a, b) => {
                    if (a.relation === "Primary") return -1;
                    if (b.relation === "Primary") return 1;
                    if (a.head_of_family) return -1;
                    if (b.head_of_family) return 1;
                    return sanitizeName(a.holderName).localeCompare(sanitizeName(b.holderName));
                });
            });
        });
        return groups;
    }, [filteredAccounts]);

    const sortedGroupEntries = useMemo(
        () => Object.entries(groupedAccounts).sort(([a], [b]) => a.localeCompare(b)),
        [groupedAccounts]
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Active":
                return "bg-green-100 text-green-800";
            case "Pending KYC":
                return "bg-yellow-100 text-yellow-800";
            case "Dormant":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const toggleGroupCollapse = (k: string) =>
        setCollapsedGroups(prev => {
            const n = new Set(prev);
            n.has(k) ? n.delete(k) : n.add(k);
            return n;
        });

    const toggleOwnerCollapse = (k: string) =>
        setCollapsedOwners(prev => {
            const n = new Set(prev);
            n.has(k) ? n.delete(k) : n.add(k);
            return n;
        });

    const toggleAccountCollapse = (k: string) =>
        setCollapsedAccounts(prev => {
            const n = new Set(prev);
            n.has(k) ? n.delete(k) : n.add(k);
            return n;
        });

    const handleSendRequest = async () => {
        if (!selectedClientCode || !selectedClientId) {
            toast &&
                toast({
                    title: "Missing account",
                    description: "No account is selected. Please select an account and try again.",
                    variant: "destructive",
                });
            return;
        }
        if (!requestMessage.trim()) {
            toast &&
                toast({ title: "Message required", description: "Please write your request.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        const subject = `${isHeadOfFamily ? "Family Mapping" : "Account"} Request — ${selectedClientCode}`;
        const html = `<html><body>
      <h1>${isHeadOfFamily ? "Family Mapping" : "Account"} Request</h1>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      <p><strong>User Role:</strong> ${isHeadOfFamily ? "Head of Family" : "Account Owners"}</p>
      <p><strong>Account Code:</strong> ${selectedClientCode}</p>
      <p><strong>Client ID:</strong> ${selectedClientId}</p>
      <p><strong>User Email:</strong> ${fallbackEmail}</p>
      <p><strong>Message:</strong><br/>${requestMessage.replace(/\n/g, "<br/>")}</p>
      </body></html>`;
        try {
            await sendEmail({
                to: "investor.relations@qodeinvest.com",
                subject,
                html,
                from: "investor.relations@qodeinvest.com",
                fromName: "myQode Portal",
                inquiry_type: "raised_request",
                nuvama_code: selectedClientCode,
                client_id: selectedClientId,
                user_email: fallbackEmail,
                message: requestMessage,
            });
            toast &&
                toast({
                    title: "Request sent",
                    description: "Your message has been emailed to our team. We'll get back to you soon.",
                });
            setRequestMessage("");
            setModalOpen(false);
        } catch (err) {
            toast &&
                toast({
                    title: "Failed to send",
                    description: "Could not send your request. Please try again or contact us directly.",
                    variant: "destructive",
                });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper for correct status dropdown text display
    const statusDisplayText = (value: string) => {
        // Add any special label mappings here if desired.
        switch (value) {
            case "All Statuses":
                return "All Statuses";
            case "Active":
                return "Active";
            case "Pending KYC":
                return "Pending KYC";
            case "Dormant":
                return "Dormant";
            default:
                return value;
        }
    };
    // Return a string as modal title instead of a React element
    const modalTitle = `Send ${isHeadOfFamily ? "family" : "account"} request`;

    return (
        <Container className="flex-1 bg-background p-4">
            <View className="flex gap-2">
            <View className="flex gap-3">
                    <View className="flex flex-row justify-between items-center gap-3">
                        <Text className="text-xl font-serif text-foreground">
                        {isHeadOfFamily ? "Family Account Tree" : "My Account"}
                        </Text>
                        {isHeadOfFamily ? (
                        <View className="bg-blue-50 text-blue-700 border-blue-200 px-2 py-1 rounded-full flex-row items-center border">
                            <Crown size={12}  className="w-2 h-2 mr-1" />
                            <Text className="text-sm font-sans text-blue-700">Head of Family</Text>
                        </View>
                        ) : (
                        <View className="bg-gray-50 text-gray-700 border-gray-200 px-2 py-1 rounded-full flex-row items-center border">
                            <User size={12} className="w-2 h-2 mr-1" />
                            <Text className="text-sm font-sans text-gray-700">Owners</Text>
                        </View>
                        )}
                    </View>
                    <View className="flex flex-row gap-2 items-center mt-3 md:mt-0">
                        <TextInput
                            placeholder={isHeadOfFamily ? "Search family members..." : "Search accounts..."}
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                            className="max-w-xs input px-3 py-2 rounded-lg border border-primary text-base flex-1"
                            placeholderTextColor="#888"
                        />
                        <Select
                            value={statusFilter}
                            onValueChange={v => setStatusFilter(v as typeof statusFilter)}
                            className="h-10 w-40"
                            placeholder="All Statuses"
                        >
                            <SelectTrigger className="w-40 mb-0 h-10 border rounded-lg p-2">
                                <SelectValue 
                                    placeholder="All Statuses"
                                    formatValue={v => statusDisplayText(v)}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem key="All Statuses" value="All Statuses">
                                    All Statuses
                                </SelectItem>
                                <SelectItem key="Active" value="Active">
                                    Active
                                </SelectItem>
                                <SelectItem key="Pending KYC" value="Pending KYC">
                                    Pending KYC
                                </SelectItem>
                                <SelectItem key="Dormant" value="Dormant">
                                    Dormant
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </View>
                </View>
                <View className="text-sm text-muted-foreground">
                    {isHeadOfFamily ? (
                        <Text>
                            As the head of family, you can see how all family accounts are mapped and organized. This consolidated view helps you manage all your family's investments in one place.
                        </Text>
                    ) : (
                        <Text>
                            This shows your individual account details. If you're part of a family group, only the head of family can see all family accounts.
                        </Text>
                    )}
                </View>

                {loading ? (
                    <FamilyTreeSkeleton />
                ) : sortedGroupEntries.length === 0 ? (
                    <View className="bg-card rounded-xl border border-primary p-6 mt-4">
                        <Text className="text-base text-center text-muted-foreground">No account data available.</Text>
                    </View>
                    
                ) : (
                    <View className="space-y-2">
                        {sortedGroupEntries.map(([groupKey, group]) => {
                            const isGroupCollapsed = collapsedGroups.has(groupKey);
                            const totalAccounts = Object.values(group.owners).reduce((sum, owner) => sum + owner.accounts.length, 0);
                            return (
                                <View key={groupKey} className="bg-card rounded-xl border p-4 mb-2">
                                    {/* Group header */}
                                    <TouchableOpacity
                                        className="flex flex-row items-center gap-3 mb-2 rounded p-2"
                                        onPress={() => toggleGroupCollapse(groupKey)}
                                        activeOpacity={0.7}
                                    >
                                        {isGroupCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                                        <View className={`h-3 w-3 rounded-full ${isHeadOfFamily ? "bg-blue-500" : "bg-gray-500"}`} />
                                        <View className="flex-1">
                                            <Text className="font-semibold text-base">
                                                {isHeadOfFamily ? sanitizeName(group.groupName) || "Family Group" : "Account Owner"}
                                            </Text>
                                            <Text className="text-xs text-muted-foreground mt-0.5">
                                                {isHeadOfFamily
                                                    ? `Group ID: ${group.groupId || "-"} | Email: ${group.groupEmail || "N/A"}`
                                                    : `Account Email: ${group.groupEmail || "N/A"}`}
                                            </Text>
                                        </View>
                                        <Text className="text-xs text-muted-foreground">
                                            {isHeadOfFamily
                                                ? `${Object.keys(group.owners).length} owner${Object.keys(group.owners).length !== 1 ? "s" : ""} | ${totalAccounts} account${totalAccounts !== 1 ? "s" : ""}`
                                                : `${totalAccounts} account${totalAccounts !== 1 ? "s" : ""}`}
                                        </Text>
                                    </TouchableOpacity>

                                    {/* Owners */}
                                    {!isGroupCollapsed && (
                                        <View className="ml-2">
                                            {Object.entries(group.owners)
                                                .sort(([, a], [, b]) =>
                                                    (sanitizeName(a.ownerName) || "Unknown").localeCompare(sanitizeName(b.ownerName) || "Unknown")
                                                )
                                                .map(([ownerKey, owner]) => {
                                                    const fullOwnerKey = `${groupKey}-${ownerKey}`;
                                                    const isOwnerCollapsed = collapsedOwners.has(fullOwnerKey);
                                                    return (
                                                        <View key={fullOwnerKey} className="mb-3">
                                                            {/* line left of owner */}
                                                            <View className="absolute h-full w-px bg-border left-0 top-0" pointerEvents="none" />
                                                            <TouchableOpacity
                                                                className="flex flex-row items-center gap-3 mb-1 rounded p-1 py-2"
                                                                onPress={() => toggleOwnerCollapse(fullOwnerKey)}
                                                                activeOpacity={0.7}
                                                            >
                                                                {isOwnerCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                                                                <View className="h-2 w-2 rounded-full bg-green-500" />
                                                                <View className="flex-1">
                                                                    <Text className="font-medium">{sanitizeName(owner.ownerName) || "Account Holder"}</Text>
                                                                    <Text className="text-xs text-muted-foreground">
                                                                        Owner ID: {owner.ownerId || "-"} | Email: {owner.ownerEmail || "N/A"}
                                                                    </Text>
                                                                </View>
                                                                <Text className="text-xs text-muted-foreground ml-2">
                                                                    {owner.accounts.length} account{owner.accounts.length !== 1 ? "s" : ""}
                                                                </Text>
                                                            </TouchableOpacity>
                                                            {/* Accounts */}
                                                            {!isOwnerCollapsed && (
                                                                <View className="ml-2">
                                                                    {owner.accounts.map((account, accountIdx) => {
                                                                        const accountKey = `${fullOwnerKey}-${account.clientid}`;
                                                                        const isAccountCollapsed = collapsedAccounts.has(accountKey);
                                                                        return (
                                                                            <View key={`${account.clientid}-${accountIdx}`} className="mb-2">
                                                                                <TouchableOpacity
                                                                                    className="flex flex-row items-center gap-2 rounded p-1 px-2"
                                                                                    onPress={() => toggleAccountCollapse(accountKey)}
                                                                                    activeOpacity={0.75}
                                                                                >
                                                                                    {isAccountCollapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
                                                                                    <View className={`h-1.5 w-1.5 rounded-full ${account.head_of_family
                                                                                            ? "bg-blue-500"
                                                                                            : account.relation === "Primary"
                                                                                                ? "bg-orange-500"
                                                                                                : "bg-gray-400"
                                                                                        }`} />
                                                                                    <View className="flex-1">
                                                                                        <View className="flex flex-row items-center gap-1">
                                                                                            <Text className="font-medium text-sm">{sanitizeName(account.holderName)}</Text>
                                                                                            {account.head_of_family && <Crown size={13} color="#2563eb" className="ml-1" />}
                                                                                        </View>
                                                                                        <Text className="text-xs text-muted-foreground">
                                                                                            Account ID: {account.accountid} | {account.relation}
                                                                                        </Text>
                                                                                    </View>
                                                                                    <View className={`px-2 py-0.5 rounded-full border ml-2 ${getStatusColor(account.status)} text-xs`}>
                                                                                        <Text className="font-semibold">{account.status}</Text>
                                                                                    </View>
                                                                                </TouchableOpacity>
                                                                                {!isAccountCollapsed && (
                                                                                    <View className="ml-2 px-2 py-2 bg-muted/20 rounded text-xs border-l-2 border-primary/10">
                                                                                        <View className="flex flex-col gap-1">
                                                                                            <View>
                                                                                                <Text className="text-muted-foreground">Client ID</Text>
                                                                                                <Text className="font-medium">{account.clientid}</Text>
                                                                                            </View>
                                                                                            <View>
                                                                                                <Text className="text-muted-foreground">Email</Text>
                                                                                                <Text className="font-medium">{account.email || "N/A"}</Text>
                                                                                            </View>
                                                                                        </View>
                                                                                    </View>
                                                                                )}
                                                                            </View>
                                                                        );
                                                                    })}
                                                                </View>
                                                            )}
                                                        </View>
                                                    );
                                                })}
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                )}
                {/* Info section with role-specific messaging */}
                <View className="rounded-lg py-1 mt-3">
                    {isHeadOfFamily ? (
                        <>
                            <Text className="text-sm leading-relaxed mb-2">
                                As the head of family, you can request changes to your family structure:
                            </Text>
                            <View className="text-sm ml-2">
                                <Text className="text-sm leading-5">{'\u2022'} Request to merge multiple accounts under one family head.{"\n"}</Text>
                                <Text className="text-sm leading-5">{'\u2022'} Request to reassign accounts to a different owner within the same family.{"\n"}</Text>
                                <Text className="text-sm leading-5">{'\u2022'} Request to split accounts into a new family group.{"\n"}</Text>
                                <Text className="text-sm leading-5">{'\u2022'} Update or change contact email ID for reporting and login purposes.</Text>
                            </View>
                        </>
                    ) : (
                        <>
                            <Text className="text-sm leading-relaxed mb-2">
                                For Owner account changes, you can request:
                            </Text>
                            <View className="text-sm ml-2">
                                <Text className="text-sm leading-5">{'\u2022'} Update your contact email ID or personal details.{"\n"}</Text>
                                <Text className="text-sm leading-5">{'\u2022'} Request to join a family group (if applicable).{"\n"}</Text>
                                <Text className="text-sm leading-5">{'\u2022'} Request account status changes or updates.{"\n"}</Text>
                                <Text className="text-sm leading-5">{'\u2022'} General account-related queries and modifications.</Text>
                            </View>
                        </>
                    )}
                </View>
                <View className="mt-3">
                    <Button
                        onPress={() => setModalOpen(true)}
                        className="w-full"
                        size="lg"
                        variant="primary"
                    >
                        {isHeadOfFamily ? "Raise Family Request" : "Raise Account Request"}
                    </Button>
                </View>
            </View>
            {/* ModalComponent: Only textarea + submit */}
            <ModalComponent
                isOpen={modalOpen}
                onClose={onClose}
                title={modalTitle}
                contentClassName="bg-card rounded-lg max-w-md w-full"
                headerClassName="flex flex-row items-center justify-between p-4 border-b border-border"
                bodyClassName="p-2"
            >
                <View>
                    <Text className="text-sm text-muted-foreground mb-3">
                        This message will be emailed to our team with your <Text className="font-bold">Client Code</Text> and <Text className="font-bold">Client ID</Text> attached.
                        {isHeadOfFamily ? <Text className="text-blue-600 font-semibold"> As head of family, you can request changes for all family accounts.</Text> : null}
                    </Text>
                    <TextInput
                        multiline
                        value={requestMessage}
                        onChangeText={setRequestMessage}
                        placeholder={
                            isHeadOfFamily
                                ? "Write your family request here (e.g., merge accounts, reassign owner, update family email)…"
                                : "Write your account request here (e.g., update email, change personal details)…"
                        }
                        editable={!isSubmitting}
                        className="min-h-32 max-h-64 p-3 border border-muted rounded-lg text-base bg-white"
                        textAlignVertical="top"
                    />
                    <View className="flex flex-row gap-2 justify-end mt-5">
                        <Button
                            onPress={onClose}
                            disabled={isSubmitting}
                            variant="outline"
                            size="md"
                            className="min-w-[80px]"
                        >
                            Cancel
                        </Button>
                        <Button
                            onPress={handleSendRequest}
                            disabled={isSubmitting}
                            variant="primary"
                            size="md"
                            className="min-w-[140px]"
                            style={{ opacity: isSubmitting ? 0.7 : 1 }}
                        >
                            {isSubmitting
                                ? "Sending…"
                                : `Raise ${isHeadOfFamily ? "Family" : "Account"} Request`}
                        </Button>
                    </View>
                </View>
            </ModalComponent>
        </Container>
    );
}