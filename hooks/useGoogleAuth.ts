import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { tokenStorage } from '@/api/auth/tokenStorage';
import { useClient } from '@/context/ClientContext';
import { useRouter } from 'expo-router';

// Enable warm-up for better UX
WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { refresh } = useClient();
  const router = useRouter();

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError('');

      // Get the backend API URL
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:2069';

      // Build the Google OAuth URL with proper redirect
      const redirectUri = 'https://auth.expo.io/@qodetech/myQode';
      const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent('openid profile email')}&` +
        `access_type=offline&` +
        `prompt=select_account`;

      console.log('Opening Google OAuth:', authUrl);

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri
      );

      console.log('OAuth Result:', result);

      if (result.type === 'success' && result.url) {
        // Extract authorization code from the callback URL
        const url = result.url;
        const params = new URLSearchParams(url.split('?')[1]);
        const code = params.get('code');

        if (code) {
          console.log('Got authorization code, exchanging for token...');

          // Send code to backend for token exchange
          const response = await fetch(`${apiUrl}/api/auth/google/callback`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code,
              redirectUri
            })
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Failed to authenticate');
          }

          if (data.accessToken) {
            // Store tokens
            await tokenStorage.setAccess(data.accessToken);
            if (data.refreshToken) {
              await tokenStorage.setRefresh(data.refreshToken);
            }

            // Refresh client context
            await refresh();

            // Navigate to PAN input for onboarding
            router.replace('/(investor)/onboarding/pan-input');
          } else {
            throw new Error('No access token received from server');
          }
        } else {
          throw new Error('No authorization code received');
        }
      } else if (result.type === 'cancel') {
        setError('Sign-in was cancelled');
      } else {
        setError('Authentication failed');
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return {
    signInWithGoogle,
    loading,
    error,
    disabled: false
  };
}
