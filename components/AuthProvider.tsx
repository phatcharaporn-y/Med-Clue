"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "../lib/supabase/client";

type Profile = { first_name: string; last_name: string; student_id: string; role: string };
type AuthContextValue = { user: User | null; profile: Profile | null; loading: boolean; signOut: () => Promise<void> };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    let active = true;
    async function loadProfile() {
      if (!session?.user) { setProfile(null); return; }
      const { data } = await createClient().from("users").select("first_name,last_name,student_id,role").eq("id", session.user.id).maybeSingle();
      if (active) setProfile(data as Profile | null);
    }
    void loadProfile();
    return () => { active = false; };
  }, [session?.user]);
  const value: AuthContextValue = {
    user: session?.user ?? null,
    profile,
    loading,
    signOut: async () => { await createClient().auth.signOut(); },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
