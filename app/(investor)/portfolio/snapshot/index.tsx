import { api } from "@/api/axios";
import { Container } from "@/components/Container";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClient } from "@/context/ClientContext";
import { Calendar, ChevronDown, ChevronRight, Crown, Hash, Mail, TrendingUp, User } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

/* =========================
   Types
   ========================= */

type FamAccWithPortfolio = {
  relation: string;
  holderName: string;
  clientcode: string;
  clientid: string;
  status: "Active" | "Pending KYC" | "Dormant";
  groupid?: string;
  groupname?: string;
  groupemailid?: string;
  ownerid?: string;
  ownername?: string;
  owneremailid?: string;
  head_of_family?: boolean;
  email?: string;
  mobile?: string;
  // Portfolio data
  portfolioValue?: number;
  reportDate?: string;
};

type PortfolioData = {
  account_code: string;
  portfolio_value: number;
  report_date: string;
};

/* =========================
   Helper Functions
   ========================= */

const formatCurrency = (value: number | undefined | null) => {
  if (value === undefined || value === null || isNaN(Number(value))) return "N/A";
  const numValue = Number(value);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue);
};

const sanitizeName = (name: string | null | undefined) => {
  if (!name || name === "null" || name.includes("null")) {
    return name?.replace(/\s*null\s*/g, "").trim() || "Unknown";
  }
  return name.trim();
};

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
/* =========================
   Skeleton Component
   ========================= */
const FamilyPortfolioSkeleton = () => (
  <View className="space-y-2">
    <View className="animate-pulse bg-card rounded-xl p-3">
      <View className="bg-border mb-2 rounded h-4 w-48" />
      <View className="pl-3 space-y-1.5">
        <View className="bg-border h-3 w-40 rounded" />
        <View className="pl-3">
          <View className="bg-border h-2.5 w-32 rounded" />
          <View className="bg-border h-5 w-24 mt-1 rounded" />
        </View>
      </View>
    </View>
  </View>
);

/* =========================
   Main Component
   ========================= */
export default function FamilyPortfolioSection() {
  const { clients, loading, isHeadOfFamily } = useClient();

  const [familyAccounts, setFamilyAccounts] = useState<FamAccWithPortfolio[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All Statuses" | "Active" | "Pending KYC" | "Dormant">("All Statuses");

  // Collapse states
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [collapsedOwners, setCollapsedOwners] = useState<Set<string>>(new Set());
  const [collapsedAccounts, setCollapsedAccounts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchFamilyAndPortfolioData = async () => {
      try {
        const familyRes = await api.get("/api/auth/client-data");
        const familyData = await familyRes.data;
        if (!familyData.success || !familyData.family) {
          console.error("No family data found:", familyData);
          return;
        }
        const mappedFamily: FamAccWithPortfolio[] = familyData.family.map((member: any) => ({
          clientid: member.clientid,
          clientcode: member.clientcode,
          holderName: sanitizeName(member.holderName),
          relation: member.relation,
          status: member.status,
          groupid: member.groupid,
          groupname: member.groupname,
          groupemailid: member.groupemailid,
          ownerid: member.ownerid,
          ownername: sanitizeName(member.ownername),
          owneremailid: member.email,
          head_of_family: member.head_of_family,
          email: member.email,
          mobile: member.mobile,
        }));
        const nuvamaCodes = mappedFamily.map(acc => acc.clientcode).filter(code => code);
        setPortfolioLoading(true);
        const portfolioRes = await api.post("/api/portfolio-details", { nuvama_codes: nuvamaCodes });
        const portfolioData = portfolioRes.data;
        if (portfolioData.success && portfolioData.data) {
          const portfolioMap = new Map<string, PortfolioData>();
          portfolioData.data.forEach((item: PortfolioData) => {
            portfolioMap.set(item.account_code, item);
          });
          const enrichedFamily = mappedFamily.map(account => {
            const portfolio = portfolioMap.get(account.clientcode);
            if (portfolio) {
              return {
                ...account,
                portfolioValue: portfolio.portfolio_value,
                reportDate: portfolio.report_date,
              };
            }
            return account;
          });
          setFamilyAccounts(enrichedFamily);
        } else {
          setFamilyAccounts(mappedFamily);
        }
      } catch (err) {
        console.error("Failed to fetch family/portfolio data:", err);
      } finally {
        setPortfolioLoading(false);
      }
    };
    fetchFamilyAndPortfolioData();
  }, []);

  // Filtering, grouping, sorting
  const filteredAccounts = useMemo(() => {
    return familyAccounts.filter(acc => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        sanitizeName(acc.holderName)?.toLowerCase().includes(q) ||
        acc.clientcode?.toLowerCase().includes(q) ||
        sanitizeName(acc.groupname)?.toLowerCase().includes(q) ||
        sanitizeName(acc.ownername)?.toLowerCase().includes(q) ||
        false;
      const matchesStatus = statusFilter === "All Statuses" || acc.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [familyAccounts, searchTerm, statusFilter]);

  const groupedAccounts = useMemo(() => {
    const groups = filteredAccounts.reduce((acc, member) => {
      const groupKey = isHeadOfFamily ? (sanitizeName(member.groupname) || "Family Group") : "Owner Portfolio";
      if (!acc[groupKey]) {
        acc[groupKey] = {
          groupName: sanitizeName(member.groupname),
          groupId: member.groupid,
          groupEmail: member.groupemailid,
          totalPortfolioValue: 0,
          owners: {} as Record<
            string,
            { ownerId?: string; ownerName?: string; ownerEmail?: string; totalPortfolioValue: number; accounts: FamAccWithPortfolio[] }
          >,
        };
      }
      const ownerKey = isHeadOfFamily ? (member.ownerid || "Unknown Owner") : (member.clientid || "Individual");
      if (!acc[groupKey].owners[ownerKey]) {
        acc[groupKey].owners[ownerKey] = {
          ownerId: member.ownerid || member.clientid,
          ownerName: isHeadOfFamily ? sanitizeName(member.ownername) : sanitizeName(member.holderName),
          ownerEmail: member.owneremailid,
          totalPortfolioValue: 0,
          accounts: [],
        };
      }
      acc[groupKey].owners[ownerKey].accounts.push(member);
      const portfolioValue = member.portfolioValue ? Number(member.portfolioValue) : 0;
      if (!isNaN(portfolioValue)) {
        acc[groupKey].totalPortfolioValue += portfolioValue;
        acc[groupKey].owners[ownerKey].totalPortfolioValue += portfolioValue;
      }
      return acc;
    }, {} as Record<
      string,
      {
        groupName?: string;
        groupId?: string;
        groupEmail?: string;
        totalPortfolioValue: number;
        owners: Record<string, {
          ownerId?: string;
          ownerName?: string;
          ownerEmail?: string;
          totalPortfolioValue: number;
          accounts: FamAccWithPortfolio[]
        }>;
      }
    >);
    Object.values(groups).forEach(group => {
      Object.values(group.owners).forEach(owner => {
        owner.accounts.sort((a, b) => {
          if (a.head_of_family) return -1;
          if (b.head_of_family) return 1;
          if (a.relation === "Primary") return -1;
          if (b.relation === "Primary") return 1;
          return sanitizeName(a.holderName).localeCompare(sanitizeName(b.holderName));
        });
      });
    });
    return groups;
  }, [filteredAccounts, isHeadOfFamily]);

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

  if (loading || portfolioLoading) {
    return <FamilyPortfolioSkeleton />;
  }

  return (
    <ProtectedRoute requireInvestor>
      <Container className="p-4 w-full flex rounded-lg bg-card">
      <View className="flex gap-3">
        {/* Header Section */}
        <View className="flex gap-2">
          <View className="flex flex-row items-center justify-between">
            <Text className="text-base font-serif text-foreground">
              {isHeadOfFamily ? "Family Portfolio Values" : "My Portfolio Values"}
            </Text>
            {isHeadOfFamily ? (
              <View className="bg-blue-50 border-blue-200 px-2 py-1 rounded-md flex-row items-center border">
                <Crown size={12} className="text-blue-600 mr-1" />
                <Text className="text-xs font-medium text-blue-700">Head of Family</Text>
              </View>
            ) : (
              <View className="bg-gray-50 border-gray-200 px-2 py-1 rounded-md flex-row items-center border">
                <User size={12} className="text-gray-600 mr-1" />
                <Text className="text-xs font-medium text-gray-700">Owner Portfolio</Text>
              </View>
            )}
          </View>
          <View className="flex flex-row gap-2 items-center">
            <TextInput
              placeholder={isHeadOfFamily ? "Search family portfolios..." : "Search accounts..."}
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
        <View className="text-sm font-sans text-muted-foreground">
          {isHeadOfFamily ? (
            <Text className="text-sm font-sans text-muted-foreground">
              As the head of family, you can view portfolio values for all family accounts. Values are updated regularly and may not reflect real-time market fluctuations.
            </Text>
          ) : (
            <Text className="text-sm font-sans text-muted-foreground">
              View your owner portfolio values. These values are updated regularly and may not reflect real-time market fluctuations.
            </Text>
          )}
        </View>

        {sortedGroupEntries.length === 0 ? (
          <View className="bg-card rounded-xl flex flex-col items-center justify-center py-8 border border-primary">
            <TrendingUp size={16} className="h-12 w-12 text-muted-foreground mb-4" />
            <Text className="text-sm text-muted-foreground text-center">No portfolio data found.</Text>
          </View>
        ) : (
          <View className="border border-primary flex align-center rounded-lg p-1">
            {sortedGroupEntries.map(([groupKey, group]) => {
              const isGroupCollapsed = collapsedGroups.has(groupKey);
              const totalAccounts = Object.values(group.owners).reduce((sum, owner) => sum + owner.accounts.length, 0);
              return (
                <View key={groupKey} className="bg-card rounded-xl overflow-hidden py-0 p-0 mb-1">
                  <View className="p-2">
                    <TouchableOpacity
                      className="flex flex-row items-center gap-2 cursor-pointer hover:bg-muted/50 rounded p-1"
                      onPress={() => toggleGroupCollapse(groupKey)}
                      activeOpacity={0.8}
                    >
                      {isGroupCollapsed ? <ChevronRight size={12} className="h-2.5 w-2.5" /> : <ChevronDown size={12} className="h-2.5 w-2.5" />}
                      <View className={`h-1.5 w-1.5 rounded-full ${isHeadOfFamily ? 'bg-blue-500' : 'bg-gray-500'}`} />
                      <View className="flex-1">
                        <Text className="font-semibold text-xs md:text-sm">
                          {isHeadOfFamily ? (sanitizeName(group.groupName) || "Family Group") : "Owner Portfolio"}
                        </Text>
                        <Text className="text-[10px] text-muted-foreground">
                          {isHeadOfFamily ? (
                            `${Object.keys(group.owners).length} owner${Object.keys(group.owners).length !== 1 ? "s" : ""} | ${totalAccounts} account${totalAccounts !== 1 ? "s" : ""}`
                          ) : (
                            `${totalAccounts} account${totalAccounts !== 1 ? "s" : ""}`
                          )}
                        </Text>
                      </View>
                      <View className="text-right">
                        <Text className="font-bold text-sm md:text-base text-primary">
                          {formatCurrency(group.totalPortfolioValue)}
                        </Text>
                        <Text className="text-[10px] text-muted-foreground">Total Value</Text>
                      </View>
                    </TouchableOpacity>
                    {!isGroupCollapsed && (
                      <View className="ml-2 md:ml-3">
                        {Object.entries(group.owners)
                          .sort(([, a], [, b]) => (sanitizeName(a.ownerName) || "Unknown").localeCompare(sanitizeName(b.ownerName) || "Unknown"))
                          .map(([ownerKey, owner]) => {
                            const fullOwnerKey = `${groupKey}-${ownerKey}`;
                            const isOwnerCollapsed = collapsedOwners.has(fullOwnerKey);
                            return (
                              <View key={fullOwnerKey} className="relative mb-2">
                                {/* Owner tree line (visual only) */}
                                <View className="absolute left-0 top-0 bottom-0 w-px bg-border" />
                                <View className="absolute left-0 top-4 w-2.5 h-px bg-border" />
                                <View className="ml-2 md:ml-3">
                                  <TouchableOpacity
                                    className="flex flex-row items-center gap-1.5 mb-1 cursor-pointer hover:bg-muted/50 rounded p-1 -m-1"
                                    onPress={() => toggleOwnerCollapse(fullOwnerKey)}
                                    activeOpacity={0.8}
                                  >
                                    {isOwnerCollapsed ? (
                                      <ChevronRight size={12} className="h-2 w-2 mr-0.5" />
                                    ) : (
                                      <ChevronDown size={12} className="h-2 w-2 mr-0.5" />
                                    )}
                                    <View className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                    <View className="flex-1">
                                      <Text className="font-medium text-xs">{sanitizeName(owner.ownerName) || 'Account Holder'}</Text>
                                      <Text className="text-[10px] text-muted-foreground">
                                        {owner.accounts.length} account{owner.accounts.length !== 1 ? 's' : ''}
                                      </Text>
                                    </View>
                                    <View className="text-right">
                                      <Text className="font-semibold text-xs md:text-sm text-primary">
                                        {formatCurrency(owner.totalPortfolioValue)}
                                      </Text>
                                      <Text className="text-[10px] text-muted-foreground">Owner Total</Text>
                                    </View>
                                  </TouchableOpacity>
                                  {!isOwnerCollapsed && (
                                    <View className="ml-1.5 md:ml-2">
                                      {owner.accounts.map((account, accountIdx) => {
                                        const accountKey = `${fullOwnerKey}-${account.clientid}`;
                                        const isAccountCollapsed = collapsedAccounts.has(accountKey);
                                        return (
                                          <View key={`${account.clientid}-${accountIdx}`} className="relative mb-1.5">
                                            {/* Account tree line (visual, not absolute) */}
                                            <View className="ml-1.5 md:ml-2">
                                              <TouchableOpacity
                                                className="flex flex-row items-center gap-1.5 mb-1 cursor-pointer hover:bg-muted/50 rounded p-1 -m-1"
                                                onPress={() => toggleAccountCollapse(accountKey)}
                                                activeOpacity={0.8}
                                              >
                                                {isAccountCollapsed ? (
                                                  <ChevronRight size={12} className="h-1.5 w-1.5" />
                                                ) : (
                                                  <ChevronDown size={12} className="h-1.5 w-1.5" />
                                                )}
                                                <View className="flex flex-row items-center gap-1">
                                                  {account.head_of_family ? (
                                                    <Crown size={12} className="h-2 w-2 mr-0.5 text-blue-600" />
                                                  ) : (
                                                    <View className={`h-1.5 w-1.5 rounded-full ${account.relation === 'Primary' ? 'bg-orange-500' : 'bg-gray-400'}`}></View>
                                                  )}
                                                </View>
                                                <View className="flex-1">
                                                  <View className="flex flex-row items-center gap-1">
                                                    <Text className="font-medium text-xs">{sanitizeName(account.holderName)}</Text>
                                                    {account.head_of_family && isHeadOfFamily && (
                                                      <View className="text-[10px] bg-blue-50 text-blue-700 px-1 py-0.5 rounded border border-blue-100 ml-0.5">
                                                        <Text className="text-[10px] text-blue-700">Head</Text>
                                                      </View>
                                                    )}
                                                  </View>
                                                  <Text className="text-[10px] text-muted-foreground">
                                                    {account.clientcode} | {account.relation}
                                                    {account.reportDate && (
                                                      <Text className="ml-0.5">
                                                        • Updated: {new Date(account.reportDate).toLocaleDateString()}
                                                      </Text>
                                                    )}
                                                  </Text>
                                                </View>
                                                <View className="text-right items-center">
                                                  <Text className="font-bold text-xs text-primary">{formatCurrency(account.portfolioValue)}</Text>
                                                  <View className={`text-[10px] px-1.5 py-px rounded border ${getStatusColor(account.status)} mt-0.5`}>
                                                    <Text className="text-[10px]">{account.status}</Text>
                                                  </View>
                                                </View>
                                              </TouchableOpacity>
                                              {!isAccountCollapsed && (
                                                <View className="ml-1 md:ml-2 p-2 bg-muted bg-opacity-20 rounded-lg border-l border-primary/20">
                                                  <View className="flex flex-col md:flex-row flex-wrap gap-1.5">
                                                    <View className="flex flex-row items-center gap-1 mb-1">
                                                      <Hash size={12} className="h-2 w-2 mr-0.5 text-muted-foreground" />
                                                      <View>
                                                        <Text className="text-[10px] text-muted-foreground">Client ID</Text>
                                                        <Text className="font-medium text-xs">{account.clientid}</Text>
                                                      </View>
                                                    </View>
                                                    <View className="flex flex-row items-center gap-1 mb-1">
                                                      <Mail size={12} className="h-2 w-2 mr-0.5 text-muted-foreground" />
                                                      <View>
                                                        <Text className="text-[10px] text-muted-foreground">Email</Text>
                                                        <Text className="font-medium text-xs">{account.email || 'N/A'}</Text>
                                                      </View>
                                                    </View>
                                                    {account.reportDate && (
                                                      <View className="flex flex-row items-center gap-1 mb-1">
                                                        <Calendar size={12} className="h-2 w-2 mr-0.5 text-muted-foreground" />
                                                        <View>
                                                          <Text className="text-[10px] text-muted-foreground">Last Updated</Text>
                                                          <Text className="font-medium text-xs">{new Date(account.reportDate).toLocaleDateString('en-IN')}</Text>
                                                        </View>
                                                      </View>
                                                    )}
                                                    <View className="flex flex-row items-center gap-1 mb-1">
                                                      <TrendingUp size={12} className="h-2 w-2 mr-0.5 text-muted-foreground" />
                                                      <View>
                                                        <Text className="text-[10px] text-muted-foreground">Portfolio Value</Text>
                                                        <Text className="font-bold text-xs text-primary">{formatCurrency(account.portfolioValue)}</Text>
                                                      </View>
                                                    </View>
                                                    {account.mobile && (
                                                      <View className="mt-1">
                                                        <Text className="text-[10px] text-muted-foreground">Mobile</Text>
                                                        <Text className="font-medium text-xs">{account.mobile}</Text>
                                                      </View>
                                                    )}
                                                  </View>
                                                </View>
                                              )}
                                            </View>
                                          </View>
                                        );
                                      })}
                                    </View>
                                  )}
                                </View>
                              </View>
                            );
                          })}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
        {/* Summary Card */}
        <View className="bg-primary-50 rounded-xl border border-primary p-3">
          <View className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
            <View>
              <Text className="font-semibold text-sm font-serif">
                {isHeadOfFamily ? "Total Family Portfolio" : "Total Portfolio Value"}
              </Text>
              <Text className="text-[10px] text-muted-foreground">
                {isHeadOfFamily
                  ? "Combined value across all family accounts"
                  : "Combined value across all your accounts"}
              </Text>
            </View>
            <View className="text-left md:text-right">
              <Text className="text-lg md:text-xl font-bold text-primary">
                {formatCurrency(
                  Object.values(groupedAccounts).reduce((sum, group) => sum + group.totalPortfolioValue, 0)
                )}
              </Text>
              <Text className="text-[10px] text-muted-foreground">
                {familyAccounts.filter(acc => acc.status === "Active").length} Active Account
                {familyAccounts.filter(acc => acc.status === "Active").length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Container>
    </ProtectedRoute>
  );
}