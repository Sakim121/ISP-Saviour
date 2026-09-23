import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

/**
 * Minimal auth layer added in Phase 8 specifically so "authenticated
 * technicians can write" (the RLS requirement) is something a real user can
 * actually satisfy. No signup/invite flow is included — technician accounts
 * are created via the Supabase Dashboard (Authentication tab) and given a
 * role by hand in the `profiles` table; see supabase/DEPLOYMENT.md.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null); // { id, role }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      return;
    }

    let cancelled = false;
    supabase
      .from('profiles')
      .select('id, role')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('[AuthContext] failed to load profile:', error);
          setProfile(null);
        } else {
          setProfile(data);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [session]);

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const isTechnician = ['super_admin', 'admin', 'support_staff', 'field_technician'].includes(
    profile?.role
  );

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        isTechnician,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
