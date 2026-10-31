import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import {
  supabase,
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOutSupabase,
  getSupabaseConfig,
  setSupabaseConfig,
} from '../lib/supabase';

interface SupabaseAuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
  updateSupabaseCredentials: (url: string, key: string) => void;
  signIn: (email: string, pass: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, pass: string, fullName?: string) => Promise<{ error: Error | null; user: User | null }>;
  signInGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

export const SupabaseAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState(getSupabaseConfig());

  useEffect(() => {
    let isMounted = true;

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    }).catch(() => {
      if (isMounted) setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const updateSupabaseCredentials = (url: string, key: string) => {
    setSupabaseConfig(url, key);
    setConfig(getSupabaseConfig());
    // reload session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });
  };

  const signIn = async (email: string, pass: string) => {
    const { error } = await signInWithEmail(email, pass);
    return { error: error ? new Error(error.message) : null };
  };

  const signUp = async (email: string, pass: string, fullName?: string) => {
    const { data, error } = await signUpWithEmail(email, pass, fullName);
    return {
      error: error ? new Error(error.message) : null,
      user: data?.user ?? null,
    };
  };

  const signInGoogle = async () => {
    const { error } = await signInWithGoogle();
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    await signOutSupabase();
    setUser(null);
    setSession(null);
  };

  return (
    <SupabaseAuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isConfigured: config.isConfigured,
        supabaseUrl: config.url,
        supabaseAnonKey: config.anonKey,
        updateSupabaseCredentials,
        signIn,
        signUp,
        signInGoogle,
        signOut,
      }}
    >
      {children}
    </SupabaseAuthContext.Provider>
  );
};

export function useSupabaseAuth(): SupabaseAuthContextType {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}
