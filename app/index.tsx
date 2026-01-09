// app/index.tsx
import { useClient } from "@/context/ClientContext";
import { Redirect } from "expo-router";
import { useEffect, useState } from 'react';
import { tokenStorage } from '@/api/auth/tokenStorage';

export default function Index() {
  const { clients, loading } = useClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await tokenStorage.getAccess();
      setIsAuthenticated(!!token);
      setCheckingAuth(false);
    };
    checkAuth();
  }, []);

  if (loading || checkingAuth) return null;

  // Has clients = investor user → portfolio
  if (clients && clients.length > 0) {
    return <Redirect href="/(investor)/portfolio/performance" />;
  }

  // Authenticated but no clients = non-investor → PAN input (onboarding)
  if (isAuthenticated && (!clients || clients.length === 0)) {
    return <Redirect href="/(investor)/onboarding/pan-input" />;
  }

  // Not authenticated → login
  return <Redirect href="/(auth)/login" />;
}
