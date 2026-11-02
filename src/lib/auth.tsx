"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";

interface AuthValue {
  user: User | null;
  session: Session | null;
  ready: boolean;
  configured: boolean;
  signIn: (email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue>({ user: null, session: null, ready: false, configured: false, signIn: async () => ({}), signOut: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const sb = getSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!sb) { setReady(true); return; }
    sb.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, [sb]);

  const signIn = useCallback(async (email: string) => {
    if (!sb) return { error: "Supabase is not configured." };
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/login` } });
    return error ? { error: error.message } : {};
  }, [sb]);

  const signOut = useCallback(async () => { await sb?.auth.signOut(); }, [sb]);

  return <AuthContext.Provider value={{ user: session?.user ?? null, session, ready, configured: Boolean(sb), signIn, signOut }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
