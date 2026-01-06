"use client";

import { api } from "@/api/axios";
import { Container } from "@/components/Container";
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Linking,
    Text,
    TouchableOpacity,
    View
} from "react-native";

// === Expo Video Imports ===
import ImageModal from "@/components/image-modal";
import VideoModal from "@/components/video-modal";

// =========================
// Types
// =========================

type ReportItem = {
  name: string;
  snapshot: string;
  video_tutorial: string;
  used_for?: string;
};

type ReportGroup = {
  id: number;
  type_of_report: string;
  report_name: ReportItem[];
};

type FlatRow = {
  sr: number;
  type: string;
  name: string;
  snapshot: string;
  tutorial: string;
  used_for: string;
};

type VideoFile = {
  name: string;
  url: string;
};

type SnapshotFile = {
  name: string;
  url: string;
};

type SnapshotData = {
  [reportName: string]: SnapshotFile[];
};



// =============== Mock Data/Helpers ================

const reports_available: ReportGroup[] = [
  {
    id: 1,
    type_of_report: "Accounting & Financial Report",
    report_name: [
      { name: "Account Statement - Non unitized", snapshot: "", video_tutorial: "" },
      { name: "Account Statement", snapshot: "", video_tutorial: "" },
      {
        name: "Profit and Loss Account - Balance Sheet",
        snapshot: "",
        video_tutorial: "",
        used_for: "Annual Compliance Reports",
      },
      { name: "Trial Balance", snapshot: "", video_tutorial: "" },
    ],
  },
  {
    id: 2,
    type_of_report: "Activity Report",
    report_name: [
      {
        name: "Transaction Statement",
        snapshot: "",
        video_tutorial: "",
        used_for: "Annual Compliance Reports",
      },
      {
        name: "Capital Register",
        snapshot: "",
        video_tutorial: "",
        used_for: "Annual Compliance Reports",
      },
      { name: "Bank Book", snapshot: "", video_tutorial: "" },
    ],
  },
  {
    id: 3,
    type_of_report: "Income, Expenses & Tax Report",
    report_name: [
      { name: "Statement of Interest", snapshot: "", video_tutorial: "" },
      { name: "Statement of Dividend", snapshot: "", video_tutorial: "" },
      {
        name: "Corporate Benefit",
        snapshot: "",
        video_tutorial: "",
        used_for: "Annual Compliance Reports",
      },
      {
        name: "Statement of Expenses",
        snapshot: "",
        video_tutorial: "",
        used_for: "Annual Compliance Reports",
      },
      {
        name: "Statement of Capital Gain/Loss",
        snapshot: "",
        video_tutorial: "",
        used_for: "Annual Compliance Reports",
      },
    ],
  },
  {
    id: 4,
    type_of_report: "Portfolio Reporting & Performance",
    report_name: [
      { name: "Portfolio Fact Sheet", snapshot: "", video_tutorial: "" },
      { name: "Portfolio Position Analysis", snapshot: "", video_tutorial: "" },
      { name: "Portfolio Performance Summary", snapshot: "", video_tutorial: "" },
      {
        name: "Performance Appraisal",
        snapshot: "",
        video_tutorial: "",
        used_for: "Annual Compliance Reports",
      },
      { name: "Portfolio Performance with Benchmarks", snapshot: "", video_tutorial: "" },
      { name: "Performance by Security Since Inception", snapshot: "", video_tutorial: "" },
      { name: "Portfolio Appraisal", snapshot: "", video_tutorial: "" },
    ],
  },
  {
    id: 5,
    type_of_report: "Combined Report",
    report_name: [
      {
        name: "PMS Investor Report",
        snapshot: "",
        video_tutorial: "",
        used_for: "Quarterly Compliance Reports",
      },
    ],
  },
];

function getFlatRows(
  data: ReportGroup[],
  videoFiles: VideoFile[],
  snapshotData: SnapshotData
): FlatRow[] {
  const rows: FlatRow[] = [];
  let sr = 1;
  data.forEach((group) => {
    group.report_name.forEach((rn) => {
      let videoFile = videoFiles.find(
        (file) => {
          const fileNameWithoutExt = file.name.toLowerCase().replace(/\.mp4$/, "");
          return fileNameWithoutExt === rn.name.toLowerCase();
        }
      );
      if (!videoFile && rn.name === "Statement of Capital Gain/Loss") {
        videoFile = videoFiles.find(
          (file) => file.name.replace(/\.mp4$/, "").toLowerCase() === "statement of capital gain loss"
        );
      }
      rows.push({
        sr: sr++,
        type: group.type_of_report,
        name: rn.name,
        snapshot: rn.snapshot,
        tutorial: videoFile?.url || "",
        used_for: rn.used_for ?? "",
      });
    });
  });
  return rows;
}

function useVideoTutorials() {
  const [videoFiles, setVideoFiles] = React.useState<VideoFile[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchVideoTutorials = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const folderUrl = `/api/list-folder?path=videos/reports-tutorial/`;
      const response = await api.get(folderUrl);
      //   if (!response.data.ok) {
      //     throw new Error("Failed to fetch video tutorials");
      //   }
      const responseData = response.data;

      const files: VideoFile[] =
        (responseData?.data || [])
          .filter((item: any) => item.filename && item.url)
          .map((item: any) => ({
            name: item.filename,
            url: item.url,
          }));

      setVideoFiles(files);
    } catch (error: any) {
      console.error("Error fetching video tutorials:", error);
      setError(error instanceof Error ? error.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchVideoTutorials();
  }, [fetchVideoTutorials]);

  return { videoFiles, loading, error, refetch: fetchVideoTutorials };
}

function useSnapshotData() {
  const [snapshotData, setSnapshotData] = React.useState<SnapshotData>({});
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchSnapshotData = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const baseUrl = `/api/list-folder?path=images/reports-snapshot/`;
      const data: SnapshotData = {};

      const reportNames =
        typeof reports_available !== "undefined"
          ? reports_available.flatMap((group) =>
              group.report_name.map((report) => report.name)
            )
          : [];

      await Promise.allSettled(
        reportNames.map(async (reportName: string) => {
          let folderName = reportName;
          if (reportName === "Statement of Capital Gain/Loss") {
            folderName = "Statement of Capital Gain Loss";
          }
          const folderUrl = `${baseUrl}${encodeURIComponent(folderName)}/`;
          try {
            const response = await api.get(folderUrl);
            // if (!response.data.ok) {
            //   return;
            // }

            const responseData = response.data;
            const files: SnapshotFile[] =
              (responseData?.data || [])
                .filter((item: any) => item.filename && item.url)
                .map((item: any) => ({
                  name: item.filename,
                  url: item.url,
                }));

            if (files.length > 0) {
              data[reportName] = files;
            }
          } catch (err) {
            // ignore individual fetch errors
          }
        })
      );

      setSnapshotData(data);
    } catch (error: any) {
      console.error("Error fetching snapshot data:", error);
      setError(error instanceof Error ? error.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSnapshotData();
  }, [fetchSnapshotData]);

  return { snapshotData, loading, error, refetch: fetchSnapshotData };
}

// =========================
// UI Primitives
// =========================

function ViewLink({
  images,
  title,
  onClick,
  isLoading = false,
}: {
  images: SnapshotFile[];
  title: string;
  onClick: (images: SnapshotFile[], title: string) => void;
  isLoading?: boolean;
}) {
  const hasImages = images && images.length > 0;
  return (
    <TouchableOpacity
      disabled={!hasImages || isLoading}
      className={`h-9 rounded-md border px-3 justify-center items-center ${hasImages
        ? "border-primary-300 bg-primary"
        : "border-dashed border-primary-300 bg-primary-100"
        }`}
      onPress={() => {
        if (hasImages && !isLoading) onClick(images, title);
      }}
    >
      {isLoading ? (
        <Text className="text-primary-600 text-xs">Loading...</Text>
      ) : (
        <Text className={`text-xs font-semibold ${hasImages ? "text-white" : "text-primary-600"}`}>
          {hasImages ? "View" : "—"}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function VideoLink({
  href,
  title,
  onClick,
  isLoading = false,
}: {
  href: string;
  title: string;
  onClick: (href: string, title: string) => void;
  isLoading?: boolean;
}) {
  const link = (href ?? "").trim();
  const isLink = link.length > 0;

  return (
    <TouchableOpacity
      disabled={!isLink || isLoading}
      className={`h-9 rounded-md border px-3 justify-center items-center ${isLink
        ? "border-primary-300 bg-primary"
        : "border-dashed border-primary-300 bg-primary-100"
        }`}
      onPress={() => {
        if (isLink && !isLoading) onClick(link, title);
      }}
    >
      {isLoading ? (
        <Text className="text-primary-600 text-xs">Loading...</Text>
      ) : (
        <Text className={`text-xs font-semibold ${isLink ? "text-white" : "text-primary-600"}`}>
          {isLink ? "Watch" : "—"}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// =========================
// Main Page Component
// =========================

export default function Page() {
  const { videoFiles, loading: videoLoading, error: videoError } = useVideoTutorials();
  const { snapshotData, loading: snapshotLoading, error: snapshotError } = useSnapshotData();

  const rows = useMemo(
    () => getFlatRows(reports_available, videoFiles, snapshotData),
    [videoFiles, snapshotData]
  );

  const [videoModalState, setVideoModalState] = useState<{
    isOpen: boolean;
    videoUrl: string;
    title: string;
  }>({
    isOpen: false,
    videoUrl: "",
    title: "",
  });

  const [imageModalState, setImageModalState] = useState<{
    isOpen: boolean;
    images: SnapshotFile[];
    title: string;
  }>({
    isOpen: false,
    images: [],
    title: "",
  });

  const handleVideoClick = useCallback((url: string, title: string) => {
    setVideoModalState({
      isOpen: true,
      videoUrl: url,
      title: `${title} - Tutorial`,
    });
  }, []);

  const handleSnapshotClick = useCallback((images: SnapshotFile[], title: string) => {
    setImageModalState({
      isOpen: true,
      images,
      title: `${title} - Snapshots`,
    });
  }, []);

  const handleCloseVideoModal = useCallback(() => {
    setVideoModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleCloseImageModal = useCallback(() => {
    setImageModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <Container className="p-4 w-full rounded-lg bg-card">
      {/* Modals */}
      <VideoModal
        isOpen={videoModalState.isOpen}
        onClose={handleCloseVideoModal}
        videoUrl={videoModalState.videoUrl}
        title={videoModalState.title}
      />

      <ImageModal
        isOpen={imageModalState.isOpen}
        onClose={handleCloseImageModal}
        images={imageModalState.images}
        title={imageModalState.title}
      />

      {/* Banner */}
      <View className="bg-primary py-3 px-4 rounded-lg mb-6">
        <Text className="text-sm font-semibold text-white text-center">
          Access all your portfolio details anytime on our secure reporting portal.
        </Text>
      </View>

      {/* Intro Section */}
      <View className="mb-8">
        <Text className="text-sm leading-6 text-primary-700 text-center mb-5 px-2">
          At Qode, transparency is central to our philosophy. That's why we provide 24x7 access to your portfolio
          through <Text className="font-semibold">WealthSpectrum</Text>, our secure reporting partner. From
          performance snapshots to tax packs, everything you need is organized in one place.
        </Text>

        <View className="items-center mb-5 w-full" style={{ minHeight: 140 }}>
          <Image
            source={require('@/assets/images/nuvama-dashboard.png')}
            style={{ width: 320, height: 140 }}
            className="rounded-xl border border-primary-200"
            resizeMode="cover"
          />
        </View>

        <View className="items-center mb-4">
          <TouchableOpacity
            onPress={() =>
              Linking.openURL(
                "https://eclientreporting.nuvamaassetservices.com/wealthspectrum/app/"
              )
            }
            className="min-w-[192px] px-4 py-3 bg-primary rounded-md border border-primary-700"
          >
            <Text className="text-base font-semibold text-white text-center">
              WealthSpectrum Portal
            </Text>
          </TouchableOpacity>
        </View>

        <Text className="text-sm italic text-center text-primary-600 mb-4 px-4">
          [Your WealthSpectrum login can be either your Account ID or your registered Email ID.]
        </Text>

        <View className="items-center pt-2">
          <Text className="text-xs text-primary-600 text-center mb-3">
            Need help setting up your password on the WealthSpectrum portal?
          </Text>
          <TouchableOpacity
            onPress={() =>
              Linking.openURL(
                "https://myqode.qodeinvest.com/tutorial-document/How%20to%20Generate%20Your%20Password%20on%20Wealth%20Spectrum.pdf"
              )
            }
            className="px-4 py-2 bg-primary-100 rounded-md border border-primary-300"
          >
            <Text className="text-sm text-primary-900">
              View Password Setup Guide (PDF)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* What You Can Access Section */}
      <View className="mb-8">
        <View className="bg-primary px-4 py-2 rounded-md mb-3">
          <Text className="text-sm font-bold text-white text-center tracking-wide">
            What You Can Access
          </Text>
        </View>

        <View className="rounded-lg border border-primary-200 overflow-hidden bg-white">
          {[
            {
              feature: "Dashboard",
              desc: "Gives you a quick snapshot of your portfolio with total assets, number of strategies, and linked accounts. The asset allocation chart shows how your investments are distributed across equity, fixed income, options, and cash.",
            },
            {
              feature: "Portfolio",
              desc: "Shows detailed information about your holdings, including cost, market value, unrealized gains/losses, and percentage allocation for each security.",
            },
            {
              feature: "Performance",
              desc: "Tracks how your portfolio has performed over time. You can view overall portfolio returns, compare with benchmarks, and check trailing returns for 1M, 3M, and 6M periods.",
            },
            {
              feature: "Allocations",
              desc: "Provides a clear breakdown of investments across asset classes and strategies, helping you understand portfolio diversification.",
            },
            {
              feature: "Transactions",
              desc: "Lists all portfolio activities including purchases, sales, and cash movements, along with realized gains and losses.",
            },
            {
              feature: "Reports",
              desc: "Access a variety of detailed reports that you will require. Below is the detailed breakdown, snapshot and video tutorials.",
            },
          ].map((row, idx, arr) => (
            <View
              key={row.feature}
              className={`px-4 py-3 ${idx < arr.length - 1 ? "border-b border-primary-200" : ""}`}
            >
              <Text className="font-semibold text-primary-900 mb-1 text-sm">
                {row.feature}
              </Text>
              <Text className="text-xs text-primary-600 leading-5">
                {row.desc}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Reports Available Section */}
      <View>
        <View className="bg-primary px-4 py-2 rounded-md mb-4">
          <Text className="text-sm font-bold text-white text-center tracking-wide">
            Reports Available
          </Text>
        </View>

        {(videoError || snapshotError) && (
          <View className="rounded-md border border-red-200 bg-red-50 p-3 mb-3">
            <Text className="text-xs text-red-700 text-center">
              {videoError && "Unable to load video tutorials. "}
              {snapshotError && "Unable to load report snapshots. "}
              Some content may not be available.
            </Text>
          </View>
        )}

        {(videoLoading || snapshotLoading) && (
          <ActivityIndicator size="small" color="#2563eb" style={{ marginVertical: 12 }} />
        )}

        {/* Table Rows */}
        <View className="border border-primary-200 rounded-lg overflow-hidden">
          {/* Table Header (non-mobile) */}
          <View className="hidden md:flex flex-row bg-primary-100 px-3 py-2 border-b border-primary-300 rounded-t-lg">
            <View className="w-12 flex-shrink-0">
              <Text className="text-xs font-semibold text-primary-900">Sr.</Text>
            </View>
            <View className="flex-1 min-w-[140px] px-2">
              <Text className="text-xs font-semibold text-primary-900">Type of Report</Text>
            </View>
            <View className="flex-1 min-w-[180px] px-2">
              <Text className="text-xs font-semibold text-primary-900">Report Name</Text>
            </View>
            <View className="w-24 flex-shrink-0">
              <Text className="text-xs font-semibold text-primary-900">Snapshot</Text>
            </View>
            <View className="w-24 flex-shrink-0">
              <Text className="text-xs font-semibold text-primary-900">Tutorial</Text>
            </View>
          </View>
          {rows.map((r, idx) => {
            const snapshots = snapshotData[r.name] || [];
            return (
              <View
                key={r.sr + "-" + r.name}
                className={`
                  flex-col md:flex-row md:items-center p-4 border-b border-primary-100 
                  bg-white md:bg-transparent
                  md:gap-0
                `}
                style={{ gap: 12 }}
              >
                {/* Responsive: Card style for mobile, table row for md+ */}
                {/* On md+, align as columns */}
                <View className="flex-col md:flex-row md:items-center font-sans mb-3 md:mb-0 md:w-full md:gap-1 gap-2">
                  {/* Sr. */}
                  <View className="flex flex-row justify-between md:w-12 md:flex-shrink-0 md:justify-center mr-3 md:mr-0">
                    <Text className="text-xs font-sans font-medium text-primary-400 md:hidden mb-1">Sr.</Text>
                    <Text className="text-xs font-sans font-bold text-primary md:text-center">{r.sr}</Text>
                  </View>
                  {/* Type */}
                  <View className="flex flex-row justify-between md:flex-1 md:min-w-[140px] md:px-2">
                    <Text className="text-xs font-medium font-sans text-primary-400 md:hidden mb-1">Type</Text>
                    <Text className="text-sm font-semibold font-sans text-primary-800 md:text-left">{r.type}</Text>
                  </View>
                  {/* Name */}
                  <View className="flex flex-col justify-between md:flex-1 md:min-w-[180px] md:px-2">
                    <Text className="text-xs font-medium font-sans text-primary-400 md:hidden mb-1">Name</Text>
                    <Text className="text-sm font-semibold font-sans text-primary-800 md:text-left">{r.name}</Text>
                    {!!r.used_for && (
                      <Text className="text-[11px] text-primary-600">
                        <Text className="text-primary-500 font-sans">Used for:</Text> <Text className="font-medium">{r.used_for}</Text>
                      </Text>
                    )}
                  </View>
                  {/* Snapshot */}
                  <View className="flex flex-row justify-between items-center md:w-24 md:flex-shrink-0 md:justify-center">
                    <Text className="text-xs font-medium text-primary-400 font-sans md:hidden mb-1">SnapShot</Text>
                    <View className="w-24 md:w-full">
                        <ViewLink
                          images={snapshots}
                          title={r.name}
                          onClick={handleSnapshotClick}
                          isLoading={snapshotLoading}
                        />
                    </View>
                  </View>
                  {/* Tutorial */}
                  <View className="flex flex-row justify-between items-center md:w-24 md:flex-shrink-0 md:justify-center">
                    <Text className="text-xs font-medium text-primary-400 font-sans md:hidden mb-1">Tutorial</Text>
                    <View className="w-24 md:w-full">
                      <VideoLink
                        href={r.tutorial}
                        title={r.name}
                        onClick={handleVideoClick}
                        isLoading={videoLoading}
                      />
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </Container>
  );
}