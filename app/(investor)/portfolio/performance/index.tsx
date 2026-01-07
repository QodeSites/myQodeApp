import { api, pyapi } from "@/api/axios";
import { Container } from "@/components/Container";
import FullscreenLoader from "@/components/layout/fullscreenloader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useClient } from "@/context/ClientContext";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Percent,
  IndianRupeeIcon as RupeeIcon,
  TrendingDown,
  TrendingUp,
  Wallet
} from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ScrollView, Switch, Text, View } from "react-native";
import {
  VictoryAxis,
  VictoryChart,
  VictoryLine,
  VictoryVoronoiContainer,
} from "victory-native";

// --- Y Domain Calculation Utility ---
const calculateYDomain = (data: number[], paddingPercent: number = 5) => {
  if (data.length === 0) return [0, 100];
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  const padding = range * (paddingPercent / 100);
  return [Math.floor(min - padding), Math.ceil(max + padding)];
};

const strategyColorConfig = {
  QAW: {
    primary: "#008455",
    secondary: "#001E13",
    strategy: "#008455",
    gradient1: "#008455",
    gradient2: "#001E13",
  },
  QTF: {
    primary: "#550E0E",
    secondary: "#360404",
    strategy: "#550E0E",
    gradient1: "#550E0E",
    gradient2: "#360404",
  },
  QGF: {
    primary: "#0A3452",
    secondary: "#051E31",
    strategy: "#3b82f6",
    gradient1: "#0A3452",
    gradient2: "#051E31",
  },
  QFH: {
    primary: "#A78C11",
    secondary: "#A78C11",
    strategy: "#A78C11",
    gradient1: "#A78C11",
    gradient2: "#A78C11"
  }
};

const strategyNames = {
  QAW: "Qode All Weather",
  QTF: "Qode Tactical Fund",
  QGF: "Qode Growth Fund",
  QFH: "Qode Future Horizons",
};
const benchmarkColor = "#9CA3AF";

type FamilyAccount = {
  clientid: string;
  clientcode: string;
  holderName: string;
  relation: string;
  status: string;
  email?: string;
};

type HistoricalData = {
  date: string;
  nav: number;
  portfolio_value: number;
  drawdown_percent: number;
  cash_in_out: number;
};
type BenchmarkHistoricalData = {
  date: string;
  nav: number;
  normalized_nav: number;
  portfolio_value: number;
  drawdown_percent: number;
  cash_in_out: number;
};
type DrawdownDataPoint = {
  date: string;
  drawdown: number;
}
type BenchmarkDrawdownDataPoint = {
  date: string;
  drawdown: number;
}
type CurrentDataType = {
  portfolio_value?: number | null;
  date?: string;
};
type CashFlowData = {
  date?: string | null;
  cash_in_out?: number;
};

type TrailingReturns = { [k: string]: number | null | undefined };
type Metrics = {
  trailing_returns?: TrailingReturns;
  quaterly_returns?: {
    percentage: Record<string, Record<string, number | null>>;
    cash: Record<string, Record<string, number | null>>;
  };
  monthly_returns?: {
    percentage: Record<string, Record<string, number | null>>;
    cash: Record<string, Record<string, number | null>>;
  };
  "Since Inception"?: number | null;
  MDD?: number | null;
  Drawdown?: number | null;
};

type BenchmarkMetrics = {
  trailing_returns?: TrailingReturns;
  "Since Inception"?: number | null;
  MDD?: number | null;
  Drawdown?: number | null;
};

const trailingPeriods = [
  { key: "1W", label: "1 Week" },
  { key: "10D", label: "10 Day" },
  { key: "1M", label: "1 Month" },
  { key: "3M", label: "3 Months" },
  { key: "6M", label: "6 Months" },
  { key: "1Y", label: "1 Year" },
  { key: "Current DD", label: "Current DD" },
  { key: "Max DD", label: "Max DD" },
  { key: "Since Inception", label: "Since Inception" }
];

const NAME_COLUMN_WIDTH = 140;
const PERIOD_COLUMN_WIDTH = 90;

const formatCurrency = (
  value: number | string | undefined | null
): string => {
  if (value === undefined || value === null || isNaN(Number(value)))
    return "0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
};

const formatPct = (x: number | null | undefined) =>
  x === null || x === undefined || isNaN(Number(x)) ? "--" : Number(x).toFixed(2) + "%";

const sanitizeName = (name: string | undefined | null): string => {
  if (!name || name === "null" || name.includes("null")) {
    return name?.replace(/\s*null\s*/g, "").trim() || "Unknown";
  }
  return name.trim();
};

function parseDayMonthYearDateString(
  dateString: string | undefined | null
): Date | null {
  if (!dateString) return null;
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(dateString);
  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]) - 1;
    const year = Number(match[3]);
    const dt = new Date(year, month, day);
    if (
      dt &&
      dt.getDate() === day &&
      dt.getMonth() === month &&
      dt.getFullYear() === year
    ) {
      return dt;
    }
  }
  const dt2 = new Date(dateString);
  if (!isNaN(dt2.getTime())) return dt2;
  return null;
}

const formatDate = (dateString: string | undefined | null): string => {
  const dt = parseDayMonthYearDateString(dateString);
  if (!dt) return "";
  return dt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatShortDate = (dateString: string | undefined | null): string => {
  const dt = parseDayMonthYearDateString(dateString);
  if (!dt) return "";
  return dt.toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });
};

const CashFlowRow = React.memo(function CashFlowRow({
  item,
}: {
  item: {
    date: string;
    cash_in_out: number;
  };
}) {
  const isInflow = Number(item.cash_in_out) > 0;
  return (
    <View className="flex flex-row px-4 py-2 items-center border-b border-b-1">
      <Text className="flex-1 text-left text-sm">
        {(() => {
          const d = parseDayMonthYearDateString(item.date);
          return d
            ? d.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : item.date || "";
        })()}
      </Text>
      <Text
        className={`flex-1 text-right text-sm font-semibold ${
          isInflow ? "text-green-600" : "text-red-600"
        }`}
      >
        {isInflow ? "+" : "-"}
        {formatCurrency(Math.abs(Number(item.cash_in_out)))}
      </Text>
      <View className="flex-1 flex-row justify-end">
        <View
          className={`${
            isInflow
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-red-50 text-red-700 border-red-200"
          } flex-row items-center gap-1 p-2 rounded-lg`}
        >
          {isInflow ? (
            <>
              <ArrowUpRight size={14} color="#22c55e" />
              <Text className="text-xs">Inflow</Text>
            </>
          ) : (
            <>
              <ArrowDownRight size={14} color="#dc2626" />
              <Text className="text-xs">Outflow</Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
});

function isPositiveReturn(val: any) {
  return val !== undefined && val !== null && val > 0;
}

function isNegativeReturn(val: any) {
  return val !== undefined && val !== null && val < 0;
}

function formatReturn(val: any) {
  if (val === undefined || val === null || isNaN(Number(val))) return '--';
  return Number(val).toFixed(2) + '%';
}

// -- Helper for months/quarters labels --
function getMonthName(n: string | number) {
  const int = typeof n === "string" ? parseInt(n, 10) : n;
  return (
    [
      "",
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ][int] || String(n)
  );
}
function getQuarterLabel(q: string) {
  if (q === "Q1") return "Q1";
  if (q === "Q2") return "Q2";
  if (q === "Q3") return "Q3";
  if (q === "Q4") return "Q4";
  if (q.toLowerCase() === "total") return "Total";
  return q;
}

// --- Monthly & Quarterly Returns Table Component ---
const PeriodicReturnsTable = React.memo(function PeriodicReturnsTable({
  metrics,
  type, // "monthly" | "quaterly"
  mode, // "percentage" | "cash"
  onModeChange
}: {
  metrics: Metrics | null | undefined,
  type: "monthly" | "quaterly",
  mode: "percentage" | "cash",
  onModeChange?: (mode: "percentage" | "cash") => void,
}) {
  if (!metrics) return null;
  let returnsData;
  if (type === "monthly") {
    returnsData = metrics.monthly_returns;
  } else if (type === "quaterly") {
    returnsData = metrics.quaterly_returns;
  } else {
    returnsData = {};
  }
  const currentData: Record<string, Record<string, number | null>> =
    (returnsData ? returnsData[mode] : {}) || {};
  // Get all years, sorted ascending (2024, 2025, 2026, ...)
  console.log(currentData, "========================currentData");
  const years = Object.keys(currentData).sort((a, b) => Number(a) - Number(b));

  // ----- FIX: allPeriods logic for quarterly should include "Total" at end -----
  let allPeriods: string[] = [];
  if (years.length > 0) {
    const set = new Set<string>();
    for (const y of years) {
      Object.keys(currentData[y] || {}).forEach((k) => set.add(k));
    }
    allPeriods = Array.from(set);
    if (type === "monthly") {
      allPeriods = allPeriods
        .filter((m) => m !== "Total")
        .map((m) => Number(m))
        .sort((a, b) => a - b)
        .map((n) => n.toString());
      if (Object.values(currentData).some((res) => "Total" in res)) {
        allPeriods.push("Total");
      }
    } else if (type === "quaterly") {
      // Always include "Total" at end if any year has it
      const q = ["Q1", "Q2", "Q3", "Q4"];
      const periodsPresent = q.filter((qq) => allPeriods.includes(qq));
      const hasTotal = Object.values(currentData).some((res) => "Total" in res);
      allPeriods = [...periodsPresent];
      if (hasTotal) allPeriods.push("Total");
    }
  }
  console.log(allPeriods, "================allPeriods");

  const periodColumnWidthPercentage = 80;
  const periodColumnWidthCash = 120; // increased width for cash mode
  const yearColumnWidth = 90;

  return (
    <View className="bg-card border rounded-xl shadow-sm flex gap-2 p-5 my-5">
      <View className="flex flex-row gap-1 text-lg font-bold text-foreground mb-2 justify-between items-center">
        <Text className="flex gap-1 text-lg font-bold text-foreground">
          {type === "monthly" ? "Monthly Returns" : "Quarterly Returns"}
        </Text>
        {onModeChange && (
          <View className="flex flex-row items-center ml-4">
            <Text className={`text-xs font-medium mr-1 ${mode === "percentage" ? "text-primary" : "text-gray-400"}`}>%</Text>
            <Switch
              value={mode === "cash"}
              onValueChange={(val) => onModeChange(val ? "cash" : "percentage")}
              trackColor={{ true: "#008455", false: "#ddd" }}
              thumbColor={mode === "cash" ? "#3b82f6" : "#ddd"}
              style={{ marginHorizontal: 2 }}
            />
            <Text className={`text-xs font-medium ml-1 ${mode === "cash" ? "text-primary" : "text-gray-400"}`}>₹</Text>
          </View>
        )}
      </View>
      <ScrollView horizontal className="w-full overflow-x-auto">
        <View className="min-w-full">
          {/* Table */}
          <View className="border-collapse divide-y border-border">
            {/* Header row */}
            <View className="flex flex-row bg-muted border-border border-b">
              <View
                className="text-left px-4 py-2 text-xs font-medium text-foreground uppercase tracking-wider justify-center items-center"
                style={{ width: yearColumnWidth }}
              >
                <Text>Year</Text>
              </View>
              {allPeriods.map((period) => (
                <View
                  key={period}
                  className={`text-center px-3 py-2 font-medium text-foreground uppercase tracking-wider justify-center items-center`}
                  style={{ width: mode === "cash" ? periodColumnWidthCash : periodColumnWidthPercentage }}
                >
                  <Text
                    className="text-xs"
                    numberOfLines={2}
                  >
                    {type === "monthly"
                      ? period === "Total"
                        ? "Total"
                        : getMonthName(period)
                      : getQuarterLabel(period)}
                  </Text>
                </View>
              ))}
            </View>
            {/* Data rows: each year */}
            {years.length === 0 ? (
              <View className="flex flex-row items-center py-3 px-4">
                <Text className="text-xs text-muted-foreground italic">
                  No data available.
                </Text>
              </View>
            ) : (
              years.map((year) => (
                <View className="flex flex-row border-border" key={year}>
                  <View
                    className="px-4 py-2 text-left text-xs font-semibold text-foreground justify-center items-center bg-muted/20"
                    style={{ width: yearColumnWidth }}
                  >
                    <Text>{year}</Text>
                  </View>
                  {allPeriods.map((period) => {
                    const val = currentData[year]?.[period];
                    const isPct = mode === "percentage";
                    let text = "--";
                    let color = undefined;
                    if (val !== null && val !== undefined && !isNaN(Number(val))) {
                      if (isPct) {
                        text = Number(val).toFixed(2) + "%";
                        color = isPositiveReturn(val)
                          ? "#008455"
                          : isNegativeReturn(val)
                          ? "#ef4444"
                          : undefined;
                      } else {
                        // cash
                        text = formatCurrency(val);
                        color = isPositiveReturn(val)
                          ? "#008455"
                          : isNegativeReturn(val)
                          ? "#ef4444"
                          : undefined;
                      }
                    }
                    return (
                      <View
                        className={`px-3 py-2 text-center justify-center items-center${!isPct ? " whitespace-nowrap" : ""}`}
                        key={period}
                        style={{ width: isPct ? periodColumnWidthPercentage : periodColumnWidthCash }}
                      >
                        {/* Only for cash mode, set numberOfLines={1} and ellipsizeMode so value stays on one line */}
                        {isPct ? (
                          <Text style={{ color }}>{text}</Text>
                        ) : (
                          <Text style={{ color }} numberOfLines={1} ellipsizeMode="tail">{text}</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
      {/* <Text className="text-gray-400 font-sans text-xs mt-2">
        {mode === "percentage"
          ? "Returns shown as % (absolute if less than 1 year, CAGR if more than 1 year)"
          : "Returns shown in cash (₹) for each period."}
      </Text> */}
    </View>
  );
});

const TrailingReturnsTable = ({
  metrics,
  benchmarkMetrics,
  colors,
  benchmarkColor,
  periods = [
    { key: "1W", label: "1 Week" },
    { key: "10D", label: "10 Day" },
    { key: "1M", label: "1 Month" },
    { key: "3M", label: "3 Months" },
    { key: "6M", label: "6 Months" },
    { key: "1Y", label: "1 Year" },
    { key: "Current DD", label: "Current DD" },
    { key: "Max DD", label: "Max DD" },
    { key: "Since Inception", label: "Since Inception" }
  ]
}: {
  metrics: Metrics | null | undefined,
  benchmarkMetrics: BenchmarkMetrics | null | undefined,
  colors: any,
  benchmarkColor: string,
  periods?: { key: string; label: string }[]
}) => {
  if (!metrics) return null;
  const trailingReturns = (metrics?.trailing_returns || {}) as { [key: string]: number | null | undefined };
  const trailingReturnsBenchmark = (benchmarkMetrics && (benchmarkMetrics?.trailing_returns || {})) as { [key: string]: number | null | undefined } | undefined;

  const nameColumnWidth = 140;
  const periodColumnWidth = 96;

  const portfolioCurrentDD = metrics?.Drawdown !== undefined && metrics?.Drawdown !== null ? Math.abs(Number(metrics.Drawdown)) : null;
  const portfolioMaxDD = metrics?.MDD !== undefined && metrics?.MDD !== null ? Math.abs(Number(metrics.MDD)) : null;

  const benchmarkCurrentDD = benchmarkMetrics && benchmarkMetrics?.Drawdown !== undefined && benchmarkMetrics?.Drawdown !== null ? Math.abs(Number(benchmarkMetrics.Drawdown)) : null;
  const benchmarkMaxDD = benchmarkMetrics && benchmarkMetrics?.MDD !== undefined && benchmarkMetrics?.MDD !== null ? Math.abs(Number(benchmarkMetrics.MDD)) : null;

  // Merge Since Inception/MDD keys from metrics also, if not already in trailingReturns
  if (!("Since Inception" in trailingReturns))
    trailingReturns["Since Inception"] = metrics["Since Inception"];
  if (!("Since Inception" in (trailingReturnsBenchmark || {})) && benchmarkMetrics)
    (trailingReturnsBenchmark as any)["Since Inception"] = benchmarkMetrics["Since Inception"];

  return (
    <View className="bg-card border rounded-xl shadow-sm flex gap-2 p-5">
      <View className="flex flex-row gap-1 text-lg font-bold text-foreground">
        <Text className="flex gap-1 text-lg font-bold text-foreground">Trailing Returns & Drawdown</Text>
      </View>
      <ScrollView horizontal className="w-full overflow-x-auto">
        <View className="min-w-full">
          {/* Table structure */}
          <View className="border-collapse divide-y border-border">
            {/* Head */}
            <View className="bg-muted">
              <View className="flex flex-row bg-muted/50 border-border border-b">
                <View
                  className="text-left px-4 py-2 text-sm font-medium text-foreground uppercase tracking-wider justify-center items-center"
                  style={{ width: nameColumnWidth }}
                >
                  <Text className="text-left text-sm font-medium text-foreground uppercase tracking-wider">Name</Text>
                </View>
                {periods.map((period) => (
                  <View
                    key={period.key}
                    className={`text-center px-4 py-2 font-medium text-foreground uppercase tracking-wider ${
                      period.key === "Current DD" ? "border-l border-border" : ""
                    } justify-center items-center`}
                    style={{ width: periodColumnWidth }}
                  >
                    <Text
                      className={`text-xs ${period.key === 'Current DD' || period.key === 'Max DD' || period.key === 'Since Inception' ? 'whitespace-normal break-words' : 'whitespace-nowrap'}`}
                      numberOfLines={3}
                    >
                      {period.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            {/* Body */}
            <View className="divide-y divide-border">
              {/* Portfolio */}
              <View className="flex flex-row border-border">
                <View
                  className="px-4 py-3 text-left whitespace-nowrap font-medium text-foreground justify-center items-center"
                  style={{ width: nameColumnWidth }}
                >
                  <Text className="text-left font-medium text-foreground">Portfolio (%)</Text>
                </View>
                {periods.map((period) => {
                  let rawValue: any;
                  let displayValue: any;
                  let cellStyle: any = {};

                  if (period.key === 'Current DD') {
                    rawValue = portfolioCurrentDD;
                    displayValue = rawValue !== null && rawValue !== undefined ? `-${Number(rawValue).toFixed(2)}%` : "--";
                    cellStyle = { color: '#ef4444' };
                  } else if (period.key === 'Max DD') {
                    rawValue = portfolioMaxDD;
                    displayValue = rawValue !== null && rawValue !== undefined ? `-${Number(rawValue).toFixed(2)}%` : "--";
                    cellStyle = { color: '#ef4444' };
                  } else if (period.key === 'Since Inception') {
                    rawValue = trailingReturns['Since Inception'];
                    displayValue = formatReturn(trailingReturns['Since Inception']);
                    cellStyle = isPositiveReturn(rawValue)
                      ? { color: colors.strategy }
                      : isNegativeReturn(rawValue)
                      ? { color: '#ef4444' }
                      : {};
                  } else {
                    rawValue = trailingReturns[period.key];
                    displayValue = formatReturn(trailingReturns[period.key]);
                    cellStyle = isPositiveReturn(rawValue)
                      ? { color: colors.strategy }
                      : isNegativeReturn(rawValue)
                      ? { color: '#ef4444' }
                      : {};
                  }
                  return (
                    <View
                      key={period.key}
                      className={`px-4 py-3 text-center whitespace-nowrap ${period.key === "Current DD" ? "border-l border-border" : ""} justify-center items-center`}
                      style={{ width: periodColumnWidth }}
                    >
                      <Text style={cellStyle}>
                        {displayValue}
                      </Text>
                    </View>
                  );
                })}
              </View>
              {/* Benchmark row */}
              {trailingReturnsBenchmark && (
                <View className="flex flex-row border-border">
                <View
                  className="px-4 py-3 text-left whitespace-nowrap font-medium text-foreground justify-center items-center"
                  style={{ width: nameColumnWidth }}
                >
                  <Text className="text-left font-medium text-foreground">BSE 500 (%)</Text>
                  </View>
                  {periods.map((period) => {
                    let rawValue: any;
                    let displayValue: any;
                    let cellStyle: any = {};

                    if (period.key === 'Current DD') {
                      rawValue = benchmarkCurrentDD;
                      displayValue = rawValue !== null && rawValue !== undefined ? `-${Number(rawValue).toFixed(2)}%` : "--";
                      cellStyle = { color: '#ef4444' };
                    } else if (period.key === 'Max DD') {
                      rawValue = benchmarkMaxDD;
                      displayValue = rawValue !== null && rawValue !== undefined ? `-${Number(rawValue).toFixed(2)}%` : "--";
                      cellStyle = { color: '#ef4444' };
                    } else if (period.key === 'Since Inception') {
                      rawValue = trailingReturnsBenchmark['Since Inception'];
                      displayValue = formatReturn(trailingReturnsBenchmark['Since Inception']);
                      cellStyle = isPositiveReturn(rawValue)
                        ? { color: benchmarkColor }
                        : isNegativeReturn(rawValue)
                        ? { color: '#ef4444' }
                        : {};
                    } else {
                      rawValue = trailingReturnsBenchmark[period.key];
                      displayValue = formatReturn(trailingReturnsBenchmark[period.key]);
                      cellStyle = isPositiveReturn(rawValue)
                        ? { color: benchmarkColor }
                        : isNegativeReturn(rawValue)
                        ? { color: '#ef4444' }
                        : {};
                    }
                    return (
                      <View
                        key={period.key}
                    className={`px-4 py-3 text-center whitespace-nowrap ${period.key === "Current DD" ? "border-l border-border" : ""} justify-center items-center`}
                    style={{ width: periodColumnWidth }}
                      >
                        <Text style={cellStyle}>
                          {displayValue}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        </View>
        
      </ScrollView>
      <Text className="text-gray-400 font-sans text-xs">Returns: Periods under 1 year are presented as absolute, while those over 1 year are annualized (CAGR)</Text>
    </View>
  );
};

export default function PortfolioPerformanceScreen() {
  const { clients, loading: clientsLoading } = useClient();
  const [chartWidth, setChartWidth] = useState<number>(0);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [familyAccounts, setFamilyAccounts] = useState<FamilyAccount[]>([]);
  const [currentData, setCurrentData] = useState<CurrentDataType | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [benchmarkMetrics, setBenchmarkMetrics] = useState<BenchmarkMetrics | null>(null);
  const [benchmarkhistoricalData, setBenchmarkHistoricalData] = useState<
    BenchmarkHistoricalData[]
  >([]);
  const [drawdownSeries, setDrawdownSeries] = useState<DrawdownDataPoint[]>([]);
  const [benchmarkDrawdownSeries, setBenchmarkDrawdownSeries] = useState<BenchmarkDrawdownDataPoint[]>([]);
  const [totalCashValue, setTotalCashValue] = useState<number>(0);
  const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([]);
  const [loading, setLoading] = useState(true);

  // State for monthly/quaterly toggle
  const [monthlyMode, setMonthlyMode] = useState<"percentage" | "cash">("percentage");
  const [quaterlyMode, setQuaterlyMode] = useState<"percentage" | "cash">("percentage");

  const initializedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    const fetchAll = async () => {
      try {
        setLoading(true);

        // FAMILY ACCOUNTS
        const familyRes = await api.get("/api/auth/client-data");
        const familyData = familyRes.data;
        let accounts: FamilyAccount[] = [];
        if (familyData.success && familyData.family) {
          accounts = familyData.family.map((member: any) => ({
            clientid: member.clientid,
            clientcode: member.clientcode,
            holderName: sanitizeName(member.holderName),
            relation: member.relation,
            status: member.status,
            email: member.email,
          }));
        }
        if (isMounted) setFamilyAccounts(accounts);

        // Select first active (or just first) only on initial mount
        if (!initializedRef.current) {
          let firstActive = accounts.find(acc => acc.status === "Active");
          if (firstActive) {
            setSelectedAccount(firstActive.clientcode);
          } else if (accounts.length > 0) {
            setSelectedAccount(accounts[0].clientcode);
          }
          initializedRef.current = true;
        }
      } catch (err) {
        if (isMounted) setFamilyAccounts([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchAll();
    return () => { isMounted = false; }
  }, []);

  // Fetch portfolio details including metrics
  useEffect(() => {
    if (!selectedAccount) {
      setCurrentData(null);
      setHistoricalData([]);
      setBenchmarkHistoricalData([]);
      setDrawdownSeries([]);
      setBenchmarkDrawdownSeries([]);
      setCashFlowData([]);
      setTotalCashValue(0);
      setMetrics(null);
      setBenchmarkMetrics(null);
      return;
    }
    let isMounted = true;
    setLoading(true);
    (async () => {
      try {
        const portfolioRes = await api.post("/api/portfolio-details", {
          nuvama_codes: [selectedAccount],
        });
        const portfolioData = portfolioRes.data;
        if (
          portfolioData.success &&
          Array.isArray(portfolioData.data) &&
          portfolioData.data.length > 0
        ) {
          if (isMounted) setCurrentData(portfolioData.data[0]);
        } else {
          if (isMounted) setCurrentData(null);
        }

        // Now, fetch history and metrics from pyapi
        const historyRes = await pyapi.get(
          `/client/client_portfolio_history/?client_account_code=${selectedAccount}`
        );
        const historyData = historyRes.data;

        // Parse metrics for client and benchmark
        if (historyData?.data?.client?.metrics) {
          if (isMounted) setMetrics(historyData.data.client.metrics);
        } else {
          if (isMounted) setMetrics(null);
        }
        if (historyData?.data?.benchmark?.metrics) {
          if (isMounted) setBenchmarkMetrics(historyData.data.benchmark.metrics);
        } else {
          if (isMounted) setBenchmarkMetrics(null);
        }

        // --- Cash flow & NAV series ---
        if (
          historyData?.data?.client?.client_transactions &&
          Array.isArray(historyData.data.client.client_transactions)
        ) {
          const filteredCashflows =
            historyData.data.client.client_transactions
              .filter(
                (item: { cash_in_out?: string | number | null }) =>
                  item.cash_in_out != null && Number(item.cash_in_out) !== 0
              )
              .map((item: any) => ({
                ...item,
                date: item.date,
                cash_in_out: Number(item.cash_in_out),
              }));

          if (isMounted) setCashFlowData(filteredCashflows);

          const total = filteredCashflows.reduce(
            (acc: number, item: { cash_in_out?: number }) =>
              acc + Number(item.cash_in_out || 0),
            0
          );
          if (isMounted) setTotalCashValue(total);

          if (
            historyData.data.client?.nav_series &&
            Array.isArray(historyData.data.client.nav_series)
          ) {
            if (isMounted)
              setHistoricalData(
                historyData.data.client.nav_series.map((item: any) => ({
                  ...item,
                  nav:
                    typeof item.nav === "number"
                      ? item.nav
                      : parseFloat(item.nav ?? "0"),
                }))
              );
            if (isMounted)
              setBenchmarkHistoricalData(
                (historyData.data.benchmark?.nav_series || []).map(
                  (item: any) => ({
                    ...item,
                    normalized_nav:
                      typeof item.normalized_nav === "number"
                        ? item.normalized_nav
                        : parseFloat(
                            item.normalized_nav ??
                              item.nav_normalized ??
                              "0"
                          ),
                    nav:
                      typeof item.nav === "number"
                        ? item.nav
                        : parseFloat(item.nav ?? "0"),
                  })
                )
              );
          } else {
            if (isMounted) setHistoricalData([]);
            if (isMounted) setBenchmarkHistoricalData([]);
          }
          // Drawdown series
          if (
            historyData.data.client?.drawdown_series &&
            Array.isArray(historyData.data.client.drawdown_series)
          ) {
            if (isMounted)
              setDrawdownSeries(
                historyData.data.client.drawdown_series.map((item: any) => ({
                  date: item.date,
                  drawdown:
                    typeof item.drawdown === "number"
                      ? item.drawdown
                      : parseFloat(item.drawdown ?? "0"),
                }))
              );
          } else {
            if (isMounted) setDrawdownSeries([]);
          }

          if (
            historyData.data.benchmark?.drawdown_series &&
            Array.isArray(historyData.data.benchmark.drawdown_series)
          ) {
            if (isMounted)
              setBenchmarkDrawdownSeries(
                historyData.data.benchmark.drawdown_series.map((item: any) => ({
                  date: item.date,
                  drawdown:
                    typeof item.drawdown === "number"
                      ? item.drawdown
                      : parseFloat(item.drawdown ?? "0"),
                }))
              );
          } else {
            if (isMounted) setBenchmarkDrawdownSeries([]);
          }
        } else {
          if (isMounted) setCashFlowData([]);
          if (isMounted) setHistoricalData([]);
          if (isMounted) setBenchmarkHistoricalData([]);
          if (isMounted) setDrawdownSeries([]);
          if (isMounted) setBenchmarkDrawdownSeries([]);
          if (isMounted) setTotalCashValue(0);
        }
      } catch (err) {
        if (isMounted) setCurrentData(null);
        if (isMounted) setCashFlowData([]);
        if (isMounted) setHistoricalData([]);
        if (isMounted) setBenchmarkHistoricalData([]);
        if (isMounted) setDrawdownSeries([]);
        if (isMounted) setBenchmarkDrawdownSeries([]);
        if (isMounted) setTotalCashValue(0);
        if (isMounted) setMetrics(null);
        if (isMounted) setBenchmarkMetrics(null);
      } finally {
        if(isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [selectedAccount]);

  // --- Chart logic below (unchanged)
  const navChartData = useMemo(() => {
    if (!historicalData || historicalData.length === 0) return [];
    const benchmark = benchmarkhistoricalData || [];

    const sortedHistorical = [...historicalData].sort((a, b) => {
      const da = parseDayMonthYearDateString(a.date);
      const db = parseDayMonthYearDateString(b.date);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return da.getTime() - db.getTime();
    });

    const benchByDate: { [date: string]: BenchmarkHistoricalData } = {};
    for (const b of benchmark) {
      if (b.date) benchByDate[b.date] = b;
    }

    return sortedHistorical.map((d) => {
      const bench = benchByDate[d.date];
      let benchmarkNav =
        bench &&
        (bench.normalized_nav !== undefined
          ? bench.normalized_nav
          : (bench as any).nav_normalized);

      return {
        date: d.date,
        portfolio_nav:
          typeof d.nav === "number"
            ? d.nav
            : parseFloat(d.nav ?? "0"),
        benchmark_nav:
          benchmarkNav != null
            ? typeof benchmarkNav === "number"
              ? benchmarkNav
              : parseFloat(benchmarkNav ?? "0")
            : null,
      };
    });
  }, [historicalData, benchmarkhistoricalData]);
  const typedCurrentData: CurrentDataType | null = currentData ?? null;

  const drawdownChartData = useMemo(() => {
    if (!drawdownSeries || drawdownSeries.length === 0) return [];
    const sorted = [...drawdownSeries].sort((a, b) => {
      const da = parseDayMonthYearDateString(a.date);
      const db = parseDayMonthYearDateString(b.date);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return da.getTime() - db.getTime();
    });
    return sorted.map((d, ix) => ({
      x: ix,
      y: d.drawdown,
      date: d.date,
    }));
  }, [drawdownSeries]);

  const benchmarkDrawdownChartData = useMemo(() => {
    if (!benchmarkDrawdownSeries || benchmarkDrawdownSeries.length === 0) return [];
    const sorted = [...benchmarkDrawdownSeries].sort((a, b) => {
      const da = parseDayMonthYearDateString(a.date);
      const db = parseDayMonthYearDateString(b.date);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return da.getTime() - db.getTime();
    });
    return sorted.map((d, ix) => ({
      x: ix,
      y: d.drawdown,
      date: d.date,
    }));
  }, [benchmarkDrawdownSeries]);

  const drawdownXTickValues = useMemo(() => {
    const dataLength = drawdownChartData.length;
    if (dataLength === 0) return [];
    if (dataLength <= 6) return drawdownChartData.map((_, i) => i);
    const numTicks = 6;
    const ticks: number[] = [];
    for (let i = 0; i < numTicks; i++) {
      const index = Math.round((dataLength - 1) * (i / (numTicks - 1)));
      ticks.push(index);
    }
    return ticks;
  }, [drawdownChartData]);
  const drawdownXTickFormat = useCallback((tick: number) => {
    const dataPoint = drawdownChartData[tick];
    return dataPoint ? formatShortDate(dataPoint.date) : "";
  }, [drawdownChartData]);

  const allDrawdownValues = useMemo(() => {
    const values = [
      ...drawdownChartData.map((d) => d.y),
      ...benchmarkDrawdownChartData.map((d) => d.y),
    ];
    if (values.length === 0) return [0];
    return values;
  }, [drawdownChartData, benchmarkDrawdownChartData]);

  const drawdownYDomain = useMemo(
    () => calculateYDomain(allDrawdownValues, 5),
    [allDrawdownValues]
  );

  const drawdownYTickValues = useMemo(() => {
    if (!drawdownYDomain || drawdownYDomain.length !== 2) return [];
    const [min, max] = drawdownYDomain;
    const numTicks = 8;
    const delta = (max - min) / (numTicks - 1);
    return Array(numTicks).fill(null).map((_, i) => {
      const val = min + i * delta;
      // If the value is positive, replace with 0
      return val > 0 ? 0 : val;
    });
  }, [drawdownYDomain]);

  const strategyCode = useMemo(() =>
    (selectedAccount?.substring(0, 3)?.toUpperCase?.() as keyof typeof strategyColorConfig) || "QAW"
  , [selectedAccount]);
  const colors = useMemo(() =>
    strategyColorConfig[strategyCode] || strategyColorConfig.QAW,
    [strategyCode]
  );

  const navSeriesForChart = useMemo(() => {
    const validData = navChartData.filter(
      (d) =>
        d.portfolio_nav != null &&
        !isNaN(Number(d.portfolio_nav)) &&
        Number(d.portfolio_nav) > 0
    );

    const portfolioLine: { value: number; label?: string; date: string }[] =
      validData.map((d) => ({
        value:
          typeof d.portfolio_nav === "number"
            ? d.portfolio_nav
            : parseFloat(d.portfolio_nav ?? "0"),
        label: d.date,
        date: d.date,
      }));

    const showBenchmark = validData.some(
      (d) =>
        d.benchmark_nav !== null &&
        d.benchmark_nav !== undefined &&
        !isNaN(Number(d.benchmark_nav))
    );
    const benchmarkLine: { value: number; label?: string; date: string }[] =
      showBenchmark
        ? validData.map((d) => ({
            value:
              d.benchmark_nav != null && !isNaN(Number(d.benchmark_nav))
                ? typeof d.benchmark_nav === "number"
                  ? d.benchmark_nav
                  : parseFloat(d.benchmark_nav ?? "0")
                : 0,
            label: d.date,
            date: d.date,
          }))
        : [];

    return { portfolioLine, benchmarkLine, showBenchmark };
  }, [navChartData]);

  const allNavValues = useMemo(() => {
    const values = [
      ...navSeriesForChart.portfolioLine.map((d) => d.value),
      ...(navSeriesForChart.showBenchmark
        ? navSeriesForChart.benchmarkLine.map((d) => d.value)
        : []),
    ].filter((v) => v > 0);
    return values;
  }, [navSeriesForChart]);

  const yDomain = useMemo(
    () => calculateYDomain(allNavValues, 5),
    [allNavValues]
  );

  const inceptionDate = useMemo(
    () => (navChartData.length > 0 ? navChartData[0].date ?? null : null),
    [navChartData]
  );
  const latestDate = useMemo(
    () =>
      navChartData.length > 0
        ? navChartData[navChartData.length - 1].date ?? null
        : null,
    [navChartData]
  );

  const chartDataPortfolio = useMemo(
    () => navSeriesForChart.portfolioLine.map((pt, ix) => ({
      x: ix,
      y: pt.value,
      date: pt.date,
    })),
    [navSeriesForChart]
  );

  const chartDataBenchmark = useMemo(() =>
    navSeriesForChart.showBenchmark
      ? navSeriesForChart.benchmarkLine.map((pt, ix) => ({
          x: ix,
          y: pt.value,
          date: pt.date,
        }))
      : [],
    [navSeriesForChart]
  );

  const xTickValues = useMemo(() => {
    const dataLength = chartDataPortfolio.length;
    if (dataLength === 0) return [];
    if (dataLength <= 6) return chartDataPortfolio.map((_, i) => i);

    const numTicks = 6;
    const ticks: number[] = [];
    for (let i = 0; i < numTicks; i++) {
      const index = Math.round((dataLength - 1) * (i / (numTicks - 1)));
      ticks.push(index);
    }
    return ticks;
  }, [chartDataPortfolio]);

  const xTickFormat = useCallback((tick: number) => {
    const dataPoint = navSeriesForChart.portfolioLine[tick];
    return dataPoint ? formatShortDate(dataPoint.date) : "";
  }, [navSeriesForChart]);

  const yTickValues = useMemo(() => {
    if (!yDomain || yDomain.length !== 2) return [];
    const [min, max] = yDomain;
    const numTicks = 8;
    const delta = (max - min) / (numTicks - 1);
    return Array(numTicks).fill(null).map((_, i) => min + i * delta);
  }, [yDomain]);

  const chartLegend = useMemo(() => (
    <View
      style={{
        flexDirection: "row",
        gap: 16,
        marginTop: 12,
        marginLeft: 8,
        alignItems: "center",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View
          style={{
            width: 16,
            height: 3,
            backgroundColor: colors.strategy,
            borderRadius: 2,
          }}
        />
        <Text
          style={{ fontSize: 13, color: "#333", fontWeight: "500" }}
        >
          Portfolio
        </Text>
      </View>
      {navSeriesForChart.showBenchmark && (
        <View
          style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
        >
          <View
            style={{
              width: 16,
              height: 3,
              backgroundColor: benchmarkColor,
              borderRadius: 2,
            }}
          />
          <Text
            style={{ fontSize: 13, color: "#333", fontWeight: "500" }}
          >
            BSE 500
          </Text>
        </View>
      )}
    </View>
  ), [navSeriesForChart.showBenchmark, colors.strategy]);

  // Drawdown chart legend
  const drawdownLegend = useMemo(() => (
    <View
      style={{
        flexDirection: "row",
        gap: 16,
        marginTop: 12,
        marginLeft: 8,
        alignItems: "center",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View
          style={{
            width: 16,
            height: 3,
            backgroundColor: colors.strategy,
            borderRadius: 2,
          }}
        />
        <Text
          style={{ fontSize: 13, color: "#333", fontWeight: "500" }}
        >
          Portfolio Drawdown
        </Text>
      </View>
      {benchmarkDrawdownChartData.length > 0 && (
        <View
          style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
        >
          <View
            style={{
              width: 16,
              height: 3,
              backgroundColor: benchmarkColor,
              borderRadius: 2,
            }}
          />
          <Text
            style={{ fontSize: 13, color: "#333", fontWeight: "500" }}
          >
            BSE 500 Drawdown
          </Text>
        </View>
      )}
    </View>
  ), [benchmarkDrawdownChartData.length, colors.strategy]);

  // Chart sections unchanged

  const chartSection = useMemo(() => (
    <View className="bg-card border rounded-xl shadow-sm p-5">
      <View className="flex flex-row gap-1 text-lg font-bold text-foreground">
        <Activity size={20} style={{ marginRight: 6 }} color={colors.primary} />
        <Text className="flex gap-1 text-lg font-bold text-foreground">NAV Performance</Text>
      </View>
      <View style={{ backgroundColor: "transparent", width: "100%" }}>
        {navSeriesForChart.portfolioLine.length > 0 ? (
          <View
            style={{ width: "100%" }}
            onLayout={(e) => {
              setChartWidth(e.nativeEvent.layout.width);
            }}
          >
            {chartWidth > 0 &&
            navSeriesForChart.portfolioLine.length > 0 ? (
              <>
                <VictoryChart
                  height={350}
                  width={chartWidth}
                  padding={{ left: 50, right: 20, top: 20, bottom: 50 }}
                  containerComponent={
                    <VictoryVoronoiContainer
                      width={chartWidth}
                      height={350}
                      voronoiDimension="x"
                      labels={() => ""}
                    />
                  }
                >
                  <VictoryAxis
                    dependentAxis
                    tickValues={yTickValues}
                    tickFormat={(t) => `${Number(t).toFixed(0)}`}
                    style={{
                      axis: { stroke: colors.strategy, strokeWidth: 2 },
                      tickLabels: { fontSize: 10, fill: colors.strategy },
                      ticks: {
                        stroke: colors.strategy,
                        size: 5,
                      },
                      grid: {
                        stroke: colors.strategy + "20",
                        strokeDasharray: "4,4",
                      },
                    }}
                  />

                  <VictoryAxis
                    tickValues={xTickValues}
                    tickFormat={xTickFormat}
                    style={{
                      axis: { stroke: colors.strategy, strokeWidth: 2 },
                      tickLabels: {
                        fontSize: 10,
                        fill: colors.strategy,
                        angle: -45,
                        textAnchor: "end",
                      },
                      ticks: {
                        stroke: colors.strategy,
                        size: 5,
                      },
                      grid: {
                        stroke: colors.strategy + "20",
                        strokeDasharray: "4,4",
                      },
                    }}
                  />

                  <VictoryLine
                    data={chartDataPortfolio}
                    style={{
                      data: {
                        stroke: colors.strategy,
                        strokeWidth: 2.5,
                      },
                    }}
                    interpolation="monotoneX"
                  />

                  {navSeriesForChart.showBenchmark && (
                    <VictoryLine
                      data={chartDataBenchmark}
                      style={{
                        data: {
                          stroke: benchmarkColor,
                          strokeWidth: 2.5,
                        },
                      }}
                      interpolation="monotoneX"
                    />
                  )}
                </VictoryChart>

                {chartLegend}
              </>
            ) : (
              <View
                style={{
                  height: 280,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Activity size={32} color="#ddd" />
                <Text className="text-sm text-muted-foreground mt-3">
                  NAV performance data unavailable.
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View
            style={{
              padding: 42,
              alignItems: "center",
              minHeight: 280,
              justifyContent: "center",
            }}
          >
            <Activity size={32} color="#ddd" />
            <Text className="text-sm text-muted-foreground mt-3">
              NAV performance data unavailable.
            </Text>
          </View>
        )}
      </View>
    </View>
  ), [chartWidth, navSeriesForChart, chartDataPortfolio, chartDataBenchmark, xTickValues, xTickFormat, yTickValues, colors.strategy, chartLegend]);

  const drawdownSection = useMemo(() => (
    <View className="bg-card border rounded-xl shadow-sm p-5 mt-5">
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View className=" flex flex-row gap-1 text-lg font-bold text-foreground">
          <TrendingDown size={20} color="#ef4444" style={{ marginRight: 6 }} />
          <Text className="flex gap-1 text-lg font-bold text-foreground">Drawdown Analysis</Text>
        </View>
      </View>
      <View style={{ backgroundColor: "transparent", width: "100%", marginTop: 10 }}>
        {drawdownChartData.length > 0 ? (
          <View style={{ width: "100%" }}>
            {chartWidth > 0 && drawdownChartData.length > 0 ? (
              <>
                <VictoryChart
                  height={350}
                  width={chartWidth}
                  padding={{ left: 50, right: 20, top: 20, bottom: 50 }}
                  containerComponent={
                    <VictoryVoronoiContainer
                      width={chartWidth}
                      height={350}
                      voronoiDimension="x"
                      labels={() => ""}
                    />
                  }
                >
                  <VictoryAxis
                    dependentAxis
                    tickValues={drawdownYTickValues}
                    tickFormat={(t) => `${Number(t).toFixed(0)}%`}
                    style={{
                      axis: { stroke: colors.strategy, strokeWidth: 2 },
                      tickLabels: { fontSize: 10, fill: colors.strategy },
                      ticks: {
                        stroke: colors.strategy,
                        size: 5,
                      },
                      grid: {
                        stroke: "#a21caf20",
                        strokeDasharray: "4,4",
                      },
                    }}
                  />

                  <VictoryAxis
                    tickValues={drawdownXTickValues}
                    tickFormat={drawdownXTickFormat}
                    style={{
                      axis: { stroke: colors.strategy, strokeWidth: 2 },
                      tickLabels: {
                        fontSize: 10,
                        fill: colors.strategy,
                        angle: -45,
                        textAnchor: "end",
                      },
                      ticks: {
                        stroke: colors.strategy,
                        size: 5,
                      },
                      grid: {
                        stroke: "#a21caf20",
                        strokeDasharray: "4,4",
                      },
                    }}
                    crossAxis={true}
                    orientation="bottom"
                  />

                  <VictoryLine
                    data={drawdownChartData}
                    style={{
                      data: {
                        stroke: "#ef4444",
                        strokeWidth: 2.5,
                      },
                    }}
                    interpolation="monotoneX"
                  />

                  {benchmarkDrawdownChartData.length > 0 && (
                    <VictoryLine
                      data={benchmarkDrawdownChartData}
                      style={{
                        data: {
                          stroke: benchmarkColor,
                          strokeWidth: 2.5,
                        },
                      }}
                      interpolation="monotoneX"
                    />
                  )}
                </VictoryChart>
                {drawdownLegend}
              </>
            ) : (
              <View
                style={{
                  height: 280,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Activity size={32} color="#ddd" />
                <Text className="text-sm text-muted-foreground mt-3">
                  Drawdown analysis data unavailable.
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View
            style={{
              padding: 42,
              alignItems: "center",
              minHeight: 280,
              justifyContent: "center",
            }}
          >
            <Activity size={32} color="#ddd" />
            <Text className="text-sm text-muted-foreground mt-3">
              Drawdown analysis data unavailable.
            </Text>
          </View>
        )}
      </View>
    </View>
  ), [
    chartWidth,
    drawdownChartData,
    benchmarkDrawdownChartData,
    drawdownXTickValues,
    drawdownXTickFormat,
    drawdownYTickValues,
    drawdownLegend,
  ]);

  const getAccountLabel = useCallback((value: string | null | undefined): string => {
    if (!value) return "";
    if (familyAccounts && familyAccounts.length > 0) {
      const acc = familyAccounts.find((a) => a.clientcode === value);
      return acc ? `${acc.holderName} (${acc.clientcode})` : value;
    }
    return value; // fallback to raw value if familyAccounts not loaded yet
  }, [familyAccounts]);

  const selectedAccountLabel = useMemo(() => {
    return getAccountLabel(selectedAccount) || null;
  }, [selectedAccount, getAccountLabel]);

  if (clientsLoading || loading) {
    return (
      <FullscreenLoader brand="Qode" subtitle="Preparing your portfolio…" />
    );
  }

  // Show trailing, then periodic tables, then chart, as requested
  return (
    <Container className="flex gap-2">
      <View className="flex gap-2 justify-center">
        <Text className="text-2xl font-serif text-foreground">
          Portfolio Details
        </Text>
        <View className="flex flex-row font-sans flex-wrap gap-1 mt-1 items-center">
          <Text className="text-sm font-sans h-full text-muted-foreground">
            {selectedAccountLabel ?? "Select an account"}
          </Text>
        </View>
        {inceptionDate && latestDate ? (
          <View className="flex flex-row flex-wrap items-center gap-3 mt-1">
            <View className="flex flex-row items-center gap-1">
              <Calendar size={16} color="#008455" />
              <Text className="text-xs font-sans text-muted-foreground">
                Inception:
              </Text>
              <Text className="text-xs font-sans font-medium text-primary">
                {formatDate(inceptionDate)}
              </Text>
            </View>
            <Text className="text-muted-foreground text-xs">•</Text>
            <View className="flex flex-row items-center gap-1">
              <Text className="text-xs font-sans text-muted-foreground">
                Data as of:
              </Text>
              <Text className="text-xs font-sans font-medium text-primary">
                {formatDate(latestDate)}
              </Text>
            </View>
          </View>
        ) : null}

        <Select value={selectedAccount} className="h-10 w-full" onValueChange={setSelectedAccount} placeholder="Select Account">
          <SelectTrigger className="w-full mb-4 h-10 border rounded-lg p-2">
            <SelectValue 
              placeholder="Select Account"
              formatValue={(value) => getAccountLabel(value)}
            />
          </SelectTrigger>
          <SelectContent>
            {(familyAccounts as FamilyAccount[]).map((acc) => (
              <SelectItem key={acc.clientcode} value={acc.clientcode}>
                <View className="flex flex-row items-center justify-between gap-2">
                  <Text className="text-base text-muted-foreground">
                    {acc.holderName}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    ({acc.clientcode})
                  </Text>
                </View>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Existing value boxes */}
        <View className="flex flex-col gap-2">
          <View className="flex-1 min-w-[150px] bg-card border rounded-xl shadow-sm p-5">
            <View className="flex flex-row justify-between mb-2 items-center">
              <Text className="text-sm text-muted-foreground font-medium">
                Amount Invested
              </Text>
              <Wallet size={16} color="#2563eb" />
            </View>
            <Text className="text-2xl font-sans text-foreground">
              {totalCashValue !== undefined && !isNaN(totalCashValue)
                ? formatCurrency(totalCashValue)
                : "--"}
            </Text>
            <Text className="text-xs mt-1 text-muted-foreground">
              Total capital deployed
            </Text>
          </View>

          <View className="flex-1 min-w-[150px] bg-card border rounded-xl shadow-sm p-5">
            <View className="flex flex-row justify-between mb-2 items-center">
              <Text className="text-sm text-muted-foreground font-medium">
                Current Value
              </Text>
              <RupeeIcon size={16} color="#16a34a" />
            </View>
            <Text className="text-2xl font-sans text-primary">
              {typedCurrentData && typedCurrentData.portfolio_value != null
                ? formatCurrency(typedCurrentData.portfolio_value)
                : "--"}
            </Text>
            <Text className="text-xs mt-1 text-muted-foreground" />
          </View>

          <View className="flex-1 min-w-[150px] bg-card border rounded-xl shadow-sm p-5">
            <View className="flex flex-row justify-between mb-2 items-center">
              <Text className="text-sm text-muted-foreground font-medium">
                Total Returns
              </Text>
              <ArrowUpRight size={16} color="#888" />
            </View>
            <Text className="text-2xl font-sans text-muted-foreground">
              {typedCurrentData && typedCurrentData.portfolio_value != null
                ? formatCurrency(
                    (typedCurrentData?.portfolio_value ?? 0) -
                      (totalCashValue ?? 0)
                  )
                : "--"}
            </Text>
            <Text className="text-xs mt-1 text-muted-foreground">
              Absolute returns
            </Text>
          </View>

          <View className="flex-1 min-w-[150px] bg-card border rounded-xl shadow-sm p-5">
            <View className="flex flex-row justify-between mb-2 items-center">
              <Text className="text-sm text-muted-foreground font-medium">
                Returns %
              </Text>
              <Percent size={16} color="#f59e42" />
            </View>
            <Text className="text-2xl font-sans text-muted-foreground">
              {typedCurrentData &&
              typedCurrentData.portfolio_value != null &&
              totalCashValue &&
              totalCashValue !== 0
                ? (
                    (((typedCurrentData?.portfolio_value ?? 0) -
                      totalCashValue) *
                      100) /
                    totalCashValue
                  ).toFixed(2) + " %"
                : "--"}
            </Text>
            <View className="flex flex-row items-center gap-1 mt-1">
              <TrendingUp size={14} color="#888" />
              <Text className="text-xs text-muted-foreground">
                Percentage returns
              </Text>
            </View>
          </View>
        </View>

        {/* === Trailing Returns/Drawdown Table === */}
        <TrailingReturnsTable
          metrics={metrics}
          benchmarkMetrics={benchmarkMetrics}
          colors={colors}
          benchmarkColor={benchmarkColor}
          periods={trailingPeriods}
        />

        {/* === Monthly/Quarterly Returns Tables with toggle === */}
        <PeriodicReturnsTable
          metrics={metrics}
          type="monthly"
          mode={monthlyMode}
          onModeChange={setMonthlyMode}
        />
        <PeriodicReturnsTable
          metrics={metrics}
          type="quaterly"
          mode={quaterlyMode}
          onModeChange={setQuaterlyMode}
        />

        {/* NAV Performance Chart */}
        {chartSection}

        {/* Drawdown Analysis Chart */}
        {drawdownSection}

        {/* ===== Cash Flow Table ===== */}
        <View className="bg-card rounded-xl shadow-sm border">
          <View className="flex flex-row items-center gap-2 px-4 py-3 ">
            <Calendar size={18} color="#008455" />
            <Text className="text-base font-bold text-foreground">
              Cash Flow History
            </Text>
          </View>
          <View>
            <View className="border-b border-border flex flex-row justify-between px-4 py-2">
              <Text className="flex-1 text-left text-sm font-semibold text-foreground">
                Date
              </Text>
              <Text className="flex-1 text-right text-sm font-semibold text-foreground">
                Amount
              </Text>
              <Text className="flex-1 text-right text-sm font-semibold text-foreground">
                Type
              </Text>
            </View>
            <View className="w-full px-0">
              <View className="bg-card rounded-b-xl">
                {cashFlowData && cashFlowData.length > 0 ? (
                  <>
                    {cashFlowData.map((item, idx) => (
                      <CashFlowRow
                        key={idx}
                        item={{
                          date: item.date ?? "",
                          cash_in_out: Number(item.cash_in_out) ?? 0,
                        }}
                      />
                    ))}
                    {/* TOTAL ROW */}
                    <View className="flex flex-row px-4 py-2 items-center">
                      <Text className="flex-1 text-left text-semibold text-primary">
                        Total
                      </Text>
                      <Text
                        className={`flex-1 text-right text-sm font-semibold ${
                          totalCashValue > 0
                            ? "text-green-600"
                            : totalCashValue < 0
                            ? "text-red-600"
                            : "text-primary"
                        }`}
                      >
                        {formatCurrency(totalCashValue)}
                      </Text>
                      <Text className="flex-1 text-right" />
                    </View>
                  </>
                ) : (
                  <View className="py-8 flex-1 justify-center items-center">
                    <Activity size={32} color="#ddd" />
                    <Text className="text-sm text-muted-foreground mt-3">
                      No cash flow history found.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>
    </Container>
  );
}
