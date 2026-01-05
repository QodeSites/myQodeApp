// app/index.tsx
import { useClient } from "@/context/ClientContext";
import { Redirect } from "expo-router";

export default function Index() {
  const { clients, loading } = useClient();

  if (loading) return null;

  if (clients && clients.length > 0) {
    return <Redirect href="/(investor)/portfolio/performance" />;
  }

  return <Redirect href="/(auth)/login" />;
}
