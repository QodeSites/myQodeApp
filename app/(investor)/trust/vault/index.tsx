"use client";

import { api } from "@/api/axios";
import { Container } from '@/components/Container';
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { useClient } from "@/context/ClientContext";
import { ChevronDown, ChevronRight, FileText, Loader2 } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Linking, Text, TouchableOpacity, View } from "react-native";

interface DocFile {
  name: string;
  url: string;
  size?: string | number;
  lastModified?: string;
  section: string;
}

interface DocSection {
  id: string;
  title: string;
  description: string;
  folderName: string;
  files: DocFile[];
  loading: boolean;
  expanded: boolean;
  disabled: boolean;
  hasError?: boolean;
}

const DOC_TEMPLATES = [
  {
    id: "pms-agreement",
    title: "PMS Agreement",
    folderName: "PMS Agreement",
    description: "Your official agreement with Qode, executed at onboarding.",
    expanded: true,
  },
  {
    id: "account-opening-docs",
    title: "Account Opening Documents",
    folderName: "Account Opening Documents",
    description: "Verification of linked bank and demat accounts.",
    expanded: false,
  },
  {
    id: "cml",
    title: "CML",
    folderName: "CML",
    description: "Capital Market License and regulatory documents.",
    expanded: false,
  },
];

const FOLDER_TO_ID: Record<string, string> = {
  "PMS Agreement": "pms-agreement",
  "Account Opening Documents": "account-opening-docs",
  "CML": "cml",
};

export default function Page() {
  const { selectedClientId, loading: clientLoading, clients } = useClient();

  const [docSections, setDocSections] = useState<DocSection[]>(
    DOC_TEMPLATES.map((template) => ({
      ...template,
      files: [],
      loading: false,
      disabled: true,
      hasError: false,
    }))
  );

  const [hadFetchError, setHadFetchError] = useState<boolean>(false);

  useEffect(() => {
    setDocSections(prev =>
      prev.map(section => ({
        ...section,
        disabled: clientLoading || !selectedClientId,
      }))
    );
  }, [clientLoading, selectedClientId]);

  const fetchAndDistributeFiles = useCallback(
    async (clientId: string) => {
      setDocSections(prev =>
        prev.map(section => ({ ...section, loading: true, hasError: false }))
      );
      setHadFetchError(false);

      try {
        const apiUrl = `/api/list-folder?path=docs/client-documents/${clientId}/`;
        const response = await api.get(apiUrl);

        if (response.status !== 200) throw new Error(`HTTP ${response.status}`);
        const responseData = response.data;

        const files: DocFile[] =
          responseData?.data?.map((item: any) => ({
            name: item.filename,
            url: item.url,
            size: item.size,
            lastModified: item.lastModified,
            section: item.section,
          })) || [];

        const grouped: Record<string, DocFile[]> = {};
        for (const file of files) {
          if (!grouped[file.section]) grouped[file.section] = [];
          grouped[file.section].push(file);
        }

        setDocSections(prev =>
          prev.map(section => ({
            ...section,
            loading: false,
            hasError: false,
            files: grouped[section.folderName] ? grouped[section.folderName] : [],
          }))
        );
      } catch (error) {
        setHadFetchError(true);
        setDocSections(prev =>
          prev.map(section => ({
            ...section,
            loading: false,
            hasError: true,
          }))
        );
      }
    },
    []
  );

  useEffect(() => {
    if (selectedClientId && !clientLoading) {
      fetchAndDistributeFiles(selectedClientId);
    }
  }, [selectedClientId, clientLoading, fetchAndDistributeFiles]);

  const retryFetch = () => {
    if (selectedClientId) {
      fetchAndDistributeFiles(selectedClientId);
    }
  };

  const toggleSection = (sectionId: string) => {
    setDocSections(prev =>
      prev.map(s =>
        s.id === sectionId ? { ...s, expanded: !s.expanded } : s
      )
    );
  };

  return (
    <ProtectedRoute requireInvestor>
      <Container className="p-4 rounded-lg bg-card h-fit">
      <View className="flex gap-2">
        <Text className="flex gap-2 items-center font-serif text-lg text-foreground">
        Account Documents
        </Text>
        <Text className="mb-2 text-base text-muted-foreground">
        Access important documents related to your Qode PMS account.
        </Text>
      </View>

      <View aria-label="docs-list" className="rounded-md border bg-card">
        <Text className="sr-only">Document list</Text>
        {clientLoading ? (
          <View>
            {[...Array(3)].map((_, index) => (
              <View key={index} className="p-3 border-b last:border-b-0">
                <View className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
                  <View className="max-w-3xl animate-pulse">
                    <View className="h-5 w-48 bg-gray-200 rounded mb-1.5" />
                    <View className="h-3 w-96 bg-gray-200 rounded" />
                  </View>
                  <View className="h-3 w-24 bg-gray-200 rounded" />
                </View>
              </View>
            ))}
          </View>
        ) : docSections.length === 0 ? (
          <View className="p-3 text-center">
            <Text className="text-xs text-muted-foreground">No documents found for this client.</Text>
          </View>
        ) : (
          <View>
            {docSections.map((section, i) => {
              const isLast = i === docSections.length - 1;
              return (
                <View
                  key={section.id}
                  className={!isLast ? "border-b border-1" : ""}
                >
                  <View className={`flex-row justify-between items-start p-3 pb-1.5 border-1${!isLast ? "" : ""}`}>
                    <View className="flex-1 flex-row max-w-3xl">
                      <View className="flex-col gap-1.5 flex w-full">
                        <View className="flex flex-row items-center gap-1.5 w-full">
                          {/* Dropdown, title, file count, and view files button are always inline and truncate/wrap as needed */}
                          <TouchableOpacity
                            onPress={() => toggleSection(section.id)}
                            disabled={section.disabled}
                            className={`flex flex-row items-center gap-1.5 text-left min-w-0 flex-1 ${section.disabled
                              ? "opacity-50"
                              : "active:opacity-80"}`}
                            accessibilityRole="button"
                            accessibilityState={{ expanded: !!section.expanded, disabled: !!section.disabled }}
                            style={{ flex: 1 }}
                          >
                            {section.loading ? (
                              <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />
                            ) : section.expanded ? (
                              <ChevronDown className="h-3 w-3 flex-shrink-0" />
                            ) : (
                              <ChevronRight className="h-3 w-3 flex-shrink-0" />
                            )}
                            <Text
                              className="text-base font-serif text-foreground"
                              // numberOfLines={1}
                              ellipsizeMode="tail"
                              style={{ flexShrink: 1, flexGrow: 1, minWidth: 0 }}
                            >
                              {section.title}
                            </Text>
                            {section.files.length > 0 && (
                              <Text className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full ml-1.5 whitespace-nowrap flex-shrink-0">
                                {section.files.length} file{section.files.length !== 1 ? "s" : ""}
                              </Text>
                            )}
                          </TouchableOpacity>
                          <View className="text-xs font-medium ml-1.5 flex-shrink-0 flex flex-row gap-1.5">
                            {section.disabled ? (
                              <Text className="text-xs text-muted-foreground">Not available</Text>
                            ) : (
                              <>
                                {section.hasError && (
                                  <Button
                                    onPress={() => retryFetch()}
                                    variant="outline"
                                    size="sm"
                                    disabled={section.loading}
                                  >
                                    Retry
                                  </Button>
                                )}
                                <Button
                                  onPress={() => toggleSection(section.id)}
                                  className="bg-primary p-1.5 rounded-lg"
                                  size="sm"
                                >
                                  {section.expanded ? "Collapse" : "View Files"}
                                </Button>
                              </>
                            )}
                          </View>
                        </View>
                        <Text className="mt-0.5 text-xs text-muted-foreground ml-5">
                          {section.description}
                          {section.hasError && (
                            <Text className="text-destructive ml-1.5">
                              (Failed to load documents)
                            </Text>
                          )}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {section.expanded && (
                    <View className="bg-muted/20 border-t">
                      {section.loading ? (
                        <View className="p-3 flex flex-row items-center justify-center gap-1.5">
                          <ActivityIndicator size="small" />
                          <Text className="text-xs text-muted-foreground ml-1.5">
                            Loading files...
                          </Text>
                        </View>
                      ) : section.files.length === 0 ? (
                        <View className="p-3">
                          <Text className="text-center text-xs text-muted-foreground">
                            {section.hasError
                              ? "Failed to load files. Please try again."
                              : "No files found in this section."
                            }
                          </Text>
                        </View>
                      ) : (
                        <View>
                          {section.files.map((file, index) => (
                            <View
                              key={`${section.id}-${index}`}
                              className={`p-3 pl-8 flex-row items-center justify-between gap-2${index !== section.files.length - 1 ? " border-b" : ""}`}
                            >
                              <View className="flex-row items-center gap-2 flex-1 min-w-0">
                                <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                <View className="min-w-0">
                                  <Text
                                    className="text-xs font-medium"
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                  >
                                    {file.name}
                                  </Text>
                                </View>
                              </View>
                              <TouchableOpacity
                                onPress={() => Linking.openURL(file.url)}
                                className="flex-shrink-0"
                                accessibilityRole="link"
                                accessibilityLabel={`Open ${file.name}`}
                              >
                                <Text className="text-xs font-medium text-primary underline">
                                  Open
                                </Text>
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>
    </Container>
    </ProtectedRoute>
  );
}