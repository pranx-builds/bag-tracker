import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '@/lib/supabase';
import { SESSION_STORE_KEY } from '@/constants';
import { logger } from '@/lib/logger';

export type Session =
  | { type: 'admin' }
  | { type: 'shop'; shopId: string; shopName: string };

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  login: (pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY = SESSION_STORE_KEY;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync(SESSION_KEY).then((stored) => {
      if (stored) {
        try { setSession(JSON.parse(stored)); } catch { /* invalid stored session */ }
      }
      setLoading(false);
    });
  }, []);

  async function login(pin: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check admin PIN first
      const { data: adminData, error: adminError } = await supabase
        .from('admin_config')
        .select('value')
        .eq('key', 'pin')
        .single();

      if (adminError) throw adminError;

      if (pin === adminData.value) {
        const sess: Session = { type: 'admin' };
        setSession(sess);
        await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(sess));
        return { success: true };
      }

      // Check shop PIN
      const { data: shop, error: shopError } = await supabase
        .from('shops')
        .select('id, name')
        .eq('pin', pin)
        .eq('is_active', true)
        .maybeSingle();

      if (shopError) throw shopError;
      if (!shop) return { success: false, error: 'Invalid PIN. Please try again.' };

      const sess: Session = { type: 'shop', shopId: shop.id, shopName: shop.name };
      setSession(sess);
      await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(sess));
      return { success: true };
    } catch (err) {
      logger.error('Login error:', err);
      return { success: false, error: 'Connection error. Check your internet and try again.' };
    }
  }

  async function logout(): Promise<void> {
    setSession(null);
    await SecureStore.deleteItemAsync(SESSION_KEY);
  }

  return (
    <AuthContext.Provider value={{ session, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
