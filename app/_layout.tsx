import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View, ActivityIndicator } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { initSettingsTable } from '@/lib/settings';
import { AuthProvider, useAuth } from '@/lib/auth';
import { Colors } from '@/lib/theme';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

function RootLayoutNav() {
  useFrameworkReady();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { session, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    initSettingsTable();
  }, []);

  useEffect(() => {
    if (loading) return;

    const inLogin = segments[0] === 'login';
    const inAdmin = segments[0] === '(admin)';
    const inShop = segments[0] === '(shop)';

    if (!session) {
      if (!inLogin) router.replace('/login');
    } else if (session.type === 'admin') {
      if (!inAdmin) router.replace('/(admin)');
    } else {
      if (!inShop) router.replace('/(shop)');
    }
  }, [session, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(shop)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ErrorBoundary>
  );
}
